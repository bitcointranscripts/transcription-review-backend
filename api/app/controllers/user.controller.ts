import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { Review, Transcript, User, Wallet } from "../db/models";
import { calculateWordDiff } from "../utils/review.inference";
import { Op } from "sequelize";
import { ReviewAttributes } from "../types/review";
import { generateJwtToken, verifyGitHubToken } from "../utils/auth";

// Create and Save a new User
export async function signUp(req: Request, res: Response) {
  // Validate request
  try {
    // Validate request
    if (!req.body.username) {
      return res.status(400).send({
        message: "Username can not be empty!",
      });
    }

    // Create a User
    const userDetails = {
      githubUsername: req.body.username,
      permissions: req.body.permissions,
      email: req.body.email,
      authToken: req.body.githubAuthToken,
      jwt: "",
    };

    const walletId = uuidv4();
    const user = await User.create(userDetails);

    // Generate JWT with user information
    const token = generateJwtToken(user);

    // Update the user record with the JWT
    await User.update({ jwt: token }, { where: { id: user.id } });

    await Wallet.create({
      userId: user.id,
      balance: 0,
      id: walletId,
    });

    return res.status(201).send(user);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create user. Some error occurred while creating the user.";
    res.status(500).send({
      message,
    });
  }
}

// Sign in a user
export async function signIn(req: Request, res: Response) {
  try {
    // Validate request
    if (!req.body.oauthToken) {
      return res.status(400).send({
        message: "OAuth token can not be empty!",
      });
    }

    const { oauthToken } = req.body;

    // Call GitHub API to verify the OAuth token
    const githubUser = await verifyGitHubToken(oauthToken);

    // Find user in the database by githubUsername or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { githubUsername: githubUser.login },
          { email: githubUser.email },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    // Generate JWT with user information
    const token = generateJwtToken(user);

    // Send the JWT back to the frontend
    res.status(200).json({ token });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to sign in. Some error occurred while signing you in.";
    res.status(500).send({
      message
    });
    res.status(500).json({ message: "Failed to log in" });
  }
}


// Retrieve all Users from the database.
export function findAll(req: Request, res: Response) {
  const username = req.query.username;
  const condition = username
    ? { username: { [Op.iLike]: `%${username.toString()}%` } }
    : {};

  User.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
}

// Find a single user with an id
export function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);

  User.findByPk(id)
    .then((data) => {
      res.send(data);
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
}

// Update a User by the id in the request
export function update(req: Request, res: Response) {
  const id = Number(req.params.id);

  User.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (typeof num === "number" && num == 1) {
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
}

export async function getUserWallet(req: Request, res: Response) {
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
}

export async function getUserReviews(req: Request, res: Response) {
  const id = req.params.id;

  var condition = { userId: { [Op.eq]: id } };

  await Review.findAll({ where: condition, include: { model: Transcript } })
    .then(async (data) => {
      const reviews: ReviewAttributes[] = [];
      const appendReviewData = data.map(async (review) => {
        const { transcript } = review;
        const transcriptData = transcript.dataValues;
        const { totalWords } = await calculateWordDiff(transcriptData);
        Object.assign(transcriptData, { contentTotalWords: totalWords });
        review.transcript = transcript;
        reviews.push(review);
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
}
//FIXME: Add an archive route in order to cater for archived(deleted) users  and filling the archivedAt field in the model.
