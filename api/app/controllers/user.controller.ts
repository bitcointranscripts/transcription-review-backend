import { Request, Response } from "express";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";

import {
  Review,
  Settings,
  Transaction,
  Transcript,
  User,
  Wallet,
} from "../db/models";
import { USER_PERMISSIONS } from "../types/user";
import { generateJwtToken } from "../utils/auth";
import { PUBLIC_PROFILE_REVIEW_LIMIT } from "../utils/constants";
import { Logger } from "../helpers/logger";

export const signIn = async (req: Request, res: Response) => {
  try {
    const { username, email, githubToken } = req.body;

    let condition: {
      email?: string;
      githubUsername?: string;
    } = {};
    if (email) {
      condition = { email: email.toLowerCase() as string };
    } else {
      condition = { githubUsername: username.toLowerCase() as string };
    }

    let user: User | null = null;
    user = await User.findOne({
      where: condition,
    });

    if (!user) {
      user = await User.create({
        email: email.toLowerCase() || null,
        permissions: USER_PERMISSIONS.REVIEWER,
        githubUsername: username.toLowerCase(),
      });

      const walletId = uuidv4();
      await Wallet.create({
        userId: user.id,
        balance: 0,
        id: walletId,
      });

      await Settings.create({
        userId: user.id,
        instantWithdraw: false,
      });
    }

    const token = generateJwtToken(user, githubToken);
    const response = await User.update(
      {
        jwt: token,
      },
      {
        where: {
          id: user.id,
        },
      }
    );

    if (response[0] !== 1) {
      Logger.error(`error response from update user token: ${response}`);
      Logger.error(`Failed to update user token for user: ${user.id}`);
      return res.status(500).json({ error: "Failed to update user token" });
    }

    return res.status(200).send({ jwt: token });
  } catch (error) {
    Logger.error(`Error signing/creating user: ${error}`);
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
    ? { username: { [Op.iLike]: `%${username.toString().toLowerCase()}%` } }
    : {};

  User.findAll({
    where: condition,
    attributes: { exclude: ["jwt", "albyToken", "email", "updatedAt"] },
  })
    .then((data) => {
      return res.send(data);
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
}

// Find a single user with an id
export function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);

  User.findByPk(id, {
    attributes: { exclude: ["jwt", "albyToken", "email", "updatedAt"] },
  })
    .then((data) => {
      return res.send(data);
    })
    .catch((_err) => {
      return res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
}
// Find a public user with github username
export async function findByPublicProfile(req: Request, res: Response) {
  const username = req.body.username;

  if (!username) throw new Error("Username is required");

  const baseExclusion = [
    "jwt",
    "albyToken",
    "email",
    "updatedAt",
    "wallet",
    "settings",
  ];

  try {
    const user = await User.findOne({
      where: { githubUsername: { [Op.eq]: username.toLowerCase() } },
      attributes: { exclude: baseExclusion },
    });
    if (!user) {
      return res.status(500).send({
        message: "No User with username=" + username,
      });
    }
    const data = await Review.findAll({
      where: { userId: { [Op.eq]: user.id } },
      limit: PUBLIC_PROFILE_REVIEW_LIMIT,
      order: [["createdAt", "DESC"]],
      include: { model: Transcript },
    });

    const isAdmin = user.permissions === "admin";

    const response = {
      user: {
        ...user.dataValues,
        id: isAdmin ? user.id : undefined,
      },
      latestReviews: data,
    };
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message:
        error instanceof Error
          ? error.message
          : "Error retrieving User with username=" + username,
    });
  }
}

// Update a User by the id in the request
export function update(req: Request, res: Response) {
  const { permissions, githubUsername } = req.body;
  const id = req.params.id;

  if (!id) {
    return res.status(400).send({
      message: "User id can not be empty!",
    });
  }
  if (!permissions && !githubUsername) {
    return res.status(400).send({
      message: "Either permissions or githubUsername should be present!",
    });
  }

  const userExists = User.findByPk(id);
  if (!userExists) {
    return res.status(404).send({
      message: "User not found",
    });
  }

  let updateData: {
    permissions?: USER_PERMISSIONS;
    githubUsername?: string;
  } = {};

  if (permissions) {
    updateData.permissions = permissions;
  }
  if (githubUsername) {
    updateData.githubUsername = githubUsername?.toLowerCase();
  }

  User.update(updateData, {
    where: {
      id: Number(id),
    },
  })
    .then((num) => {
      if (Array.isArray(num) && num[0] == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.status(500).send({
          message: `Cannot update User with id=${id}.`,
        });
      }
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error updating User with id=" + id,
      });
    });
}

export async function getUserWallet(req: Request, res: Response) {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).send({
      message: "userId can not be empty!",
    });
  }

  try {
    const wallet = await Wallet.findOne({
      where: {
        userId: Number(userId),
      },
      include: { model: Transaction },
    });
    let settings = await Settings.findOne({
      where: {
        userId: userId,
      },
    });
    if (!settings) {
      await Settings.create({
        userId: Number(userId),
        instantWithdraw: false,
      })
        .then((data) => {
          settings = data;
        })
        .catch((_err) => {
          throw new Error("Error creating settings for user");
        });
    }
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
      const walletData = {
        ...wallet.dataValues,
        transactions: [],
        instantWithdraw: settings!.instantWithdraw,
      };
      return res.status(200).send(walletData);
    }
    const walletData = {
      ...wallet.dataValues,
      instantWithdraw: settings!.instantWithdraw,
    };
    return res.status(200).send(walletData);
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: "Some error occurred while retrieving wallet for the user.",
    });
  }
}

export async function getUserReviews(req: Request, res: Response) {
  const id = req.params.id;

  var condition = { userId: { [Op.eq]: id } };

  await Review.findAll({ where: condition, include: { model: Transcript } })
    .then(async (data) => {
      res.send(data);
    })
    .catch((err) => {
      return res.status(500).send({
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
