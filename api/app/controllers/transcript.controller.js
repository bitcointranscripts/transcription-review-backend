const db = require("../models");
const Transcript = db.transcripts;
const Op = db.Sequelize.Op;

// Create and Save a new Transcript
exports.create = (req, res) => {
  // Validate request
  if (!req.body.content) {
    //FIXME: Include original content check in if condition
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Transcript
  const transcript = {
    // We have to add title because for some reason having just content makes an update to an existing record insted of inserting a new one
    originalContent: req.body.originalContent,
    content: req.body.content
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

// Retrieve all Transcripts from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.iLike]: `%${title}%` } } : null;

  Transcript.findAll({ where: condition })
    .then(data => {
      res.send(data);
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
//FIXME: Add an archive route in order to cater for archived transcripts and filling the archivedAt field in the model. 
