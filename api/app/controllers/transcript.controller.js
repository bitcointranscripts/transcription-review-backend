const db = require("../sequelize/models");
const Transcript = db.transcript
const User = db.user
const Op = db.Sequelize.Op;

// Create and Save a new Transcript
exports.create = (req, res) => {
  // Validate request
  if (!req.body.content) {
    res.status(400).send({
      message: "Content cannot be empty!"
    });
    return;
  }
  
  else if (!req.body.originalContent) {
    res.status(400).send({
      message: "Original Content cannot be empty!"
    });
    return;
  }

  const getFirstFiveWords = (paragraph) => {
    const words = paragraph.trim().split(/\s+/);
    return words.slice(0, 5).join(' ');
  };

  const generateUniqueStr = () => {

    const oc = req.body.originalContent;
    const str = oc.title + getFirstFiveWords(oc.body); 
    const transcriptHash = str.trim().toLowerCase();

    return transcriptHash;
  }

  // Create a Transcript
  const transcript = {
    originalContent: req.body.originalContent,
    content: req.body.content,
    transcriptHash: generateUniqueStr()
  };

  // Save Transcript in the database
  Transcript.create(transcript)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Transcript."
      });
    });
};

// Retrieve all unarchived transcripts from the database.
exports.findAll = (req, res) => {
  var condition = {[Op.and]: [{ status: 'queued' }, { archivedAt: null }, { archivedBy: null }]};

  Transcript.findAll({ where: condition })
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transcript."
      });
    });
};

// Find a single Transcript with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Transcript.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Transcript with id=" + id
      });
    });
};

// Update a Transcript by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  //FIXME: Ensure only necessary fields are updated i.e. content, updatedAt 
  Transcript.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Transcript was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Transcript with id=" + id
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
      message: "User unauthorized to archive transcripts."
    });
    return;
  }

  Transcript.update({ archivedAt: new Date(), archivedBy: req.body.archivedBy }, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Transcript was archived successfully."
        });
      } else {
        res.send({
          message: `Cannot archive Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error archiving Transcript with id=" + id
      });
    });
};

exports.claim = async (req, res) => {
  const id = req.params.id;

  const uid = req.body.claimedBy;

  var condition = { claimedBy:{[Op.eq]: uid} };

  const transcript = await Transcript.findAll({ where: condition })

  if (transcript.length) {
    res.status(403).send({
      message: "User already has a transcript claimed."
    });
    return;
  }

  Transcript.update({ status: 'not queued', claimedAt: new Date(), claimedBy: req.body.claimedBy}, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Transcript was claimed successfully."
        });
      } else {
        res.send({
          message: `Cannot claim Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error claiming Transcript with id=" + id
      });
    });
};