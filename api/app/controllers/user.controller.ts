import { Request, Response } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";

import { Review, Transaction, Transcript, User, Wallet } from "../db/models";
import { ReviewAttributes } from "../types/review";
import { USER_PERMISSIONS } from "../types/user";
import { generateJwtToken } from "../utils/auth";
import { calculateWordDiff } from "../utils/review.inference";

export const signIn = async (req: Request, res: Response) => {
  try {
    const githubToken = req.headers["x-github-token"];
    const { username, email } = req.body;

    let condition = {};
    if (email) {
      condition = { email };
    } else {
      condition = { githubUsername: username };
    }

    let user: User | null = null;
    user = await User.findOne({
      where: condition,
    });

    if (!user) {
      user = await User.create({
        email: email ?? "",
        permissions: USER_PERMISSIONS.REVIEWER,
        githubUsername: username,
      });

      const walletId = uuidv4();
      await Wallet.create({
        userId: user.id,
        balance: 0,
        id: walletId,
      });
    }

    const token = generateJwtToken(user, githubToken!.toString());
    const response = await User.update(
      { jwt: token },
      { where: condition }
    );

    if (response[0] !== 1) {
      return res.status(500).json({ error: "Failed to update user token" });
    }
    return res.status(200).send({ jwt: token });
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
        res.status(200).send({
          message: "User was updated successfully.",
        });
      } else {
        res.status(200).send({
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

  try {
    const wallet = await Wallet.findOne({
      where: {
        userId: userId,
      },
      include: { model: Transaction },
    });
    if (!wallet) {
      const user = await User.findOne({
        where: {
          id: userId,
        },
      });
      if (!user) {
        return res
          .status(404)
          .send({ status: 404, message: "user does not exist" });
      }
      const walletId = uuidv4();
      const wallet = await Wallet.create({
        userId: user.id,
        balance: 0,
        id: walletId,
      });
      const walletData = { ...wallet, transactions: [] };
      res.status(200).send(walletData);
    }
    res.status(200).send(wallet);
  } catch (err) {
    res.status(500).send({
      message: "Some error occurred while retrieving wallet for the user.",
    });
  }
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
