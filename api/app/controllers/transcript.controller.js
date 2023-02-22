const db = require("../models");
const Transcript = db.transcripts;
const Op = db.Sequelize.Op;

// Create and Save a new Transcript
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Transcript
  const transcript = {
    title: req.body.title,
    details: req.body.details,
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

// Retrieve all Transcript from the database.
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

// Delete a Transcript with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Transcript.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Transcript was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Transcript with id=${id}. Maybe Transcript was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Transcript with id=" + id
      });
    });
};

// Delete all Transcript from the database.
exports.deleteAll = (req, res) => {
  Transcript.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Transcript were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all transcripts."
      });
    });
};

