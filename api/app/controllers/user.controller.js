const { v4: uuidv4 } = require("uuid");
const db = require("../sequelize/models");
const { calculateWordDiff } = require("../utils/review.inference");
const User = db.user;
const Review = db.review;
const Transcript = db.transcript;
const Wallet = db.wallet;
const Op = db.Sequelize.Op;

// Create and Save a new User
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.username) {
    res.status(400).send({
      message: "Username can not be empty!",
    });
    return;
  }

  // Create a User
  const userDetails = {
    githubUsername: req.body.username,
    permissions: req.body.permissions,
  };

  try {
    const walletId = uuidv4();
    const user = await User.create(userDetails);
    await Wallet.create({
      userId: user.dataValues.id,
      balance: 0,
      id: walletId,
    });
    return res.send(user);
  } catch (error) {
    res.status(500).send({
      message:
        error.message ||
        "Unable to create user. Some error occurred while creating the user.",
    });
  }
};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  const username = req.query.username;
  var condition = username
    ? { username: { [Op.iLike]: `%${username}%` } }
    : null;

  User.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

// Find a single user with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then((data) => {
      res.send(data);
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  User.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating User with id=" + id,
      });
    });
};

exports.getUserWallet = async (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).send({
      message: "userId can not be empty!",
    });
    return;
  }

  await Wallet.findOne({
    where: {
      userId: userId,
    },
  })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: "Some error occurred while retrieving wallet for the user.",
      });
    });
};

exports.getUserReviews = async (req, res) => {
  const id = req.params.id;

  var condition = { userId: { [Op.eq]: id } };

  await Review.findAll({ where: condition, include: { model: Transcript } })
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
        message:
          err.message ||
          "Some error occurred while retrieving reviews for the user.",
      });
    });
};
//FIXME: Add an archive route in order to cater for archived(deleted) users  and filling the archivedAt field in the model.
