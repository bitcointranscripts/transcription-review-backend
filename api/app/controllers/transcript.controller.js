const db = require("../sequelize/models");
const Transcript = db.transcript;
const Review = db.review;
const User = db.user;
const Op = db.Sequelize.Op;
const {
  buildIsActiveCondition,
  calculateWordDiff,
  buildIsPendingCondition,
} = require("../utils/review.inference");
const { setupExpiryTimeCron } = require("../utils/cron");
const { TRANCRIPT_STATUS } = require("../utils/constants");
const { maxPendingReviews } = require("../utils/config");

// Create and Save a new Transcript
exports.create = (req, res) => {
  // Validate request
  if (!req.body.content) {
    res.status(400).send({
      message: "Content cannot be empty!",
    });
    return;
  }

  const getFirstFiveWords = (paragraph) => {
    const words = paragraph.trim().split(/\s+/);
    return words.slice(0, 5).join(" ");
  };

  const generateUniqueStr = () => {
    const oc = req.body.content;
    const str = oc.title + getFirstFiveWords(oc.body);
    const transcriptHash = str.trim().toLowerCase();

    return transcriptHash;
  };

  // Create a Transcript
  const transcript = {
    originalContent: req.body.content,
    content: req.body.content,
    transcriptHash: generateUniqueStr(),
  };

  // Save Transcript in the database
  Transcript.create(transcript)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Transcript.",
      });
    });
};

// Retrieve all unarchived and queued transcripts from the database.
exports.findAll = (req, res) => {
  var condition = {
    [Op.and]: [
      { archivedAt: null },
      { archivedBy: null },
      { status: TRANCRIPT_STATUS.QUEUED },
    ],
  };

  Transcript.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transcript.",
      });
    });
};

// Find a single Transcript with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  Transcript.findByPk(id)
    .then(async (data) => {
      // console.log(data)
      let r = await calculateWordDiff(data);
      console.log({ r });
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Transcript with id=" + id,
      });
    });
};

// Update a Transcript by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  //FIXME: Ensure only necessary fields are updated i.e. content, updatedAt
  Transcript.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Transcript was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Transcript with id=" + id,
      });
    });
};

// Archive a Transcript by the id in the request
exports.archive = async (req, res) => {
  const id = req.params.id;

  const uid = req.body.archivedBy;

  const reviewer = await User.findByPk(uid);

  if (!reviewer || reviewer.permissions !== "admin") {
    res.status(403).send({
      message: "User unauthorized to archive transcripts.",
    });
    return;
  }

  Transcript.update(
    { archivedAt: new Date(), archivedBy: req.body.archivedBy },
    {
      where: { id: id },
    }
  )
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Transcript was archived successfully.",
        });
      } else {
        res.send({
          message: `Cannot archive Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error archiving Transcript with id=" + id,
      });
    });
};

exports.claim = async (req, res) => {
  const transcriptId = req.params.id;

  const uid = req.body.claimedBy;
  const currentTime = new Date().getTime();
  const activeCondition = buildIsActiveCondition(currentTime);
  const pendingCondition = buildIsPendingCondition(currentTime);
  const userCondition = {
    userId: { [Op.eq]: uid },
  };

  const activeReview = await Review.findAll({ where: {...userCondition, ...activeCondition} });
  if (activeReview.length) {
    res.status(403).send({
      message: "Cannot claim transcript, user has an active review",
    });
    return;
  }
  
  const pendingReview = await Review.findAll({ where: {...userCondition, ...pendingCondition} });
  if (pendingReview.length >= maxPendingReviews) {
    res.status(403).send({
      message: "User has too many pending reviews, clear some and try again!",
    });
    return;
  }

  const review = {
    userId: uid,
    transcriptId,
  };

  await Transcript.update(
    {
      status: TRANCRIPT_STATUS.NOT_QUEUED,
      claimedAt: new Date(),
      claimedBy: req.body.claimedBy,
    },
    {
      where: { id: transcriptId },
    }
  )
    .then((num) => {
      if (num == 1) {
        // Save review in the database
        Review.create(review)
          .then((data) => {
            res.send(data);
            setupExpiryTimeCron(data);
          })
          .catch((err) => {
            res.status(500).send({
              message:
                err.message || "Some error occurred while creating the review.",
            });
          });
      } else {
        res.send({
          message: `Cannot claim Transcript with id=${transcriptId}. Maybe Transcript was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error claiming Transcript with id=" + transcriptId,
      });
    });
};
