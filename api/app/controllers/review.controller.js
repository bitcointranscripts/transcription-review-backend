const db = require("../sequelize/models");
const { QUERY_REVIEW_STATUS } = require("../utils/constants");
const Review = db.review;
const User = db.user;
const Transcript = db.transcript;
const Op = db.Sequelize.Op;
const {
  buildIsActiveCondition,
  buildIsInActiveCondition,
  buildIsPendingCondition,
  calculateWordDiff,
} = require("../utils/review.inference");

// Create and Save a new review
exports.create = (req, res) => {
  // Validate request
  if (!req.body.userId) {
    res.status(400).send({
      message: "User id can not be empty!",
    });
    return;
  }

  if (!req.body.transcriptId) {
    res.status(400).send({
      message: "Transcript id can not be empty!",
    });
    return;
  }
  // Create a review
  const review = {
    userId: req.body.userId,
    transcriptId: req.body.transcriptId,
  };

  // Save review in the database
  Review.create(review)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the review.",
      });
    });
};

// Retrieve all reviews from the database.
exports.findAll = async (req, res) => {
  let queryStatus = req.query.status;
  let userId =
    req.query.userId !== "undefined" ? parseInt(req.query.userId) : undefined;
  let username =
    req.query.username !== "undefined" ? req.query.username : undefined;

  // find reviews by username
  if (username) {
    try {
      const foundUser = await User.findOne({
        where: { githubUsername: username },
      });
      if (foundUser?.dataValues?.id) {
        userId = foundUser?.dataValues?.id;
      } else {
        return res.status(404).send({
          message: `User with username=${username} does not exist`,
        });
      }
    } catch (err) {
      return res.status(500).send({
        message:
          err.message ||
          `Some error occurred while getting user with username=${username}`,
      });
    }
  }

  let groupedCondition = {};
  const currentTime = new Date().getTime();

  // userId condition
  const userIdCondition = { userId: { [Op.eq]: userId } };

  // add condition if query exists
  if (Boolean(userId)) {
    groupedCondition = { ...groupedCondition, ...userIdCondition };
  }
  if (queryStatus) {
    switch (queryStatus) {
      case QUERY_REVIEW_STATUS.ACTIVE:
        const activeCondition = buildIsActiveCondition(currentTime);
        groupedCondition = { ...groupedCondition, ...activeCondition };
        break;
      case QUERY_REVIEW_STATUS.PENDING:
        const pendingCondition = buildIsPendingCondition();
        groupedCondition = { ...groupedCondition, ...pendingCondition }
        break;
      case QUERY_REVIEW_STATUS.INACTIVE:
        const inActiveCondition = buildIsInActiveCondition(currentTime);
        groupedCondition = { ...groupedCondition, ...inActiveCondition };
        break;
      default:
        break;
    }
  }

  await Review.findAll({
    where: groupedCondition,
    include: { model: Transcript },
  })
    .then(async (data) => {
      const reviews = [];
      const appendReviewData = data.map(async ({ dataValues }) => {
        const transcript = dataValues.transcript.dataValues;
        const { totalWords } = await calculateWordDiff(transcript);
        Object.assign(transcript, { contentTotalWords: totalWords });
        dataValues.transcript = transcript;
        reviews.push(dataValues);
      });
      Promise.all(appendReviewData).then(() => {
        res.send(reviews);
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving reviews.",
      });
    });
};

// Find a single review with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  await Review.findByPk(id, { include: { model: Transcript } })
    .then(async (data) => {
      const transcript = data.dataValues.transcript.dataValues;
      const { totalWords } = await calculateWordDiff(transcript);
      await Object.assign(transcript, { contentTotalWords: totalWords });
      res.send(data);
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error retrieving review with id=" + id,
      });
    });
};

// Update a review by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  await Review.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "review was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update review with id=${id}. Maybe review was not found or req.body is empty!`,
        });
      }
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error updating review with id=" + id,
      });
    });
};

// Submit a review by the id in the request
exports.submit = async (req, res) => {
  const id = req.params.id;
  const { pr_url } = req.body;

  if (!pr_url) {
    return res.status(400).send({
      message: "pr_url is missing",
    });
  }
  const submittedAt = new Date();
  await Review.update(
    { submittedAt, pr_url },
    {
      where: { id: id },
    }
  )
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "review was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update review with id=${id}. Maybe review was not found`,
        });
      }
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error updating review with id=" + id,
      });
    });
};
