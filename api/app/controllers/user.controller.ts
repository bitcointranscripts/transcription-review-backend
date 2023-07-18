import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { Review, Transcript, User, Wallet } from "../db/models";
import { calculateWordDiff } from "../utils/review.inference";
import { Op } from "sequelize";
import { ReviewAttributes } from "../types/review";
import { generateJwtToken, verifyGitHubToken } from "../utils/auth";
import {UserAttributes} from "../types/user";

export async function signUp(req: Request, res: Response) {
  const githubToken = req.headers["x-github-token"];
  try {
    // Validate request
    if (!req.body.username) {
      return res.status(400).send({
        message: "Username cannot be empty!",
      });
    }

    if(!githubToken) {
      return res.status(403).send({
        message: "Github token cannot be empty!",
      });
    }

    // Create a User
    const userDetails: UserAttributes = {
      githubUsername: req.body.username,
      permissions: req.body.permissions,
      email: req.body.email,
    };

    const walletId = uuidv4();
    const user = await User.create(userDetails);


    // Generate JWT with user information
    const token = generateJwtToken(user, githubToken.toString());

    // Update the user record with the JWT
    await User.update({ jwt: token }, { where: { id: user.id } });

    // Include the JWT in the user object
    const userWithJwt = { ...user.toJSON(), jwt: token };

    await Wallet.create({
      userId: user.id,
      balance: 0,
      id: walletId,
    });

    return res.status(201).send(userWithJwt);
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
export const signIn = async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request body
    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).send({
        message: "User ID cannot be empty",
      });
    }

    // Find the user in the database
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve the JWT from the user object
    const { jwt } = user;

    if (!jwt) {
      return res.status(401).json({ error: "JWT not found for the user" });
    }

    return res.status(200).send({ jwt });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to sign in. Some error occurred while signing in.";
    res.status(500).send({
      message,
    });
  }
};


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

export async function logout(req: Request, res: Response) {
  const userId = req.body.userId;
  if (!userId) {
    res.status(400).send({
      message: "userId can not be empty!",
    });
    return;
  }

  await User.update(
    { jwt: null },
    {
      where: {
        id: userId,
      },
    }
  )
    .then((_data) => {
      res.status(200).send({
        message: "User logged out successfully.",
      });
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Some error occurred while logging out the user.",
      });
    });
}
