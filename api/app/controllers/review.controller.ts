import { Request, Response } from "express";
import { Op } from "sequelize";

import { Review, Transcript, User } from "../db/models";
import {
  DB_QUERY_LIMIT,
  DB_START_PAGE,
  QUERY_REVIEW_STATUS,
} from "../utils/constants";
import {
  buildIsActiveCondition,
  buildIsInActiveCondition,
  buildIsPendingCondition,
} from "../utils/review.inference";

// Create and Save a new review
export async function create(req: Request, res: Response) {
  const { userId, transcriptId } = req.body;
  // Validate request
  if (!userId) {
    res.status(400).send({
      message: "User id can not be empty!",
    });
    return;
  }

  if (!transcriptId) {
    res.status(400).send({
      message: "Transcript id can not be empty!",
    });
    return;
  }
  // Create a review
  const review = {
    userId: userId,
    transcriptId: transcriptId,
  };

  // Save review in the database
  await Review.create(review)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the review.",
      });
    });
}

// Retrieve all reviews from the database.
export async function findAll(req: Request, res: Response) {
  let queryStatus = req.query.status;
  const userId = Number(req.body.userId);
  const page: number = Number(req.query.page) || 1;
  const limit: number = Number(req.query.limit) || 5;
  const offset: number = (page - 1) * limit;

  const user = await User.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    res.status(400).send({
      message: `User with id=${userId} does not exist`,
    });
    return;
  }

  let groupedCondition = {};
  const currentTime = new Date().getTime();

  const userIdCondition = { userId: { [Op.eq]: user.id } };

  // add condition if query exists
  if (Boolean(user.id)) {
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
        groupedCondition = { ...groupedCondition, ...pendingCondition };
        break;
      case QUERY_REVIEW_STATUS.INACTIVE:
        const inActiveCondition = buildIsInActiveCondition(currentTime);
        groupedCondition = { ...groupedCondition, ...inActiveCondition };
        break;
      default:
        break;
    }
  }

  try {
    const totalItems = await Review.count({
      where: groupedCondition,
    });
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const data = await Review.findAll({
      where: groupedCondition,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      include: { model: Transcript },
    });

    const response = {
      totalItems: totalItems,
      itemsPerPage: limit,
      totalPages: totalPages,
      currentPage: page,
      hasNextPage,
      hasPreviousPage,
      data,
    };
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message:
        error instanceof Error
          ? error.message
          : "Some error occurred while retrieving reviews.",
    });
  }
}

// Find a single review with an id
export async function findOne(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const userId = req.body.userId;

  if (!id) {
    res.status(400).send({
      message: "Review id cannot be empty!",
    });
    return;
  }

  await Review.findOne({
    where: { id: id, userId: userId },
    include: { model: Transcript },
  })
    .then(async (data) => {
      if (!data) {
        return res.status(404).send({
          message: `Review with id=${id} does not exist`,
        });
      }
      res.status(200).send(data);
    })
    .catch((_err) => {
      res.status(500).send({
        message: "Error retrieving review with id=" + id,
      });
    });
}

// Update a review by the id in the request
export async function update(req: Request, res: Response) {
  const id = req.params.id;
  const userId = req.body.userId;

  await Review.update(req.body, {
    where: { id: id, userId: userId },
  })
    .then(async (num) => {
      if (Array.isArray(num) && num[0] == 1) {
        return res.status(200).send({
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
}

// Submit a review by the id in the request
export async function submit(req: Request, res: Response) {
  const id = req.params.id;
  const { pr_url } = req.body;

  if (!pr_url) {
    return res.status(400).send({
      message: "pr_url is missing",
    });
  }

  try {
    const [num] = await Review.update(
      { submittedAt: new Date(), pr_url },
      {
        where: { id: id },
      }
    );

    if (num === 1) {
      res.send({
        message: "Review was updated successfully.",
      });
    } else {
      res.status(404).send({
        message: `Cannot update review with id=${id}. Maybe review was not found`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating review with id=" + id,
    });
  }
}

export const getAllReviewsForAdmin = async (req: Request, res: Response) => {
  const submittedAt = req.query.submittedAt as string;
  const transcriptId = Number(req.query.transcriptId)
  const userId = Number(req.query.userId);
  const mergedAt = req.query.mergedAt as string;
  const userSearch = req.query.user as string;
  const page: number = Number(req.query.page) || DB_START_PAGE;
  const limit: number = Number(req.query.limit) || DB_QUERY_LIMIT;

  const condition: {
    [key: string | number]: any;
  } = {};

  const userCondition: {
    [Op.or]?: {
      email?: { [Op.iLike]: string };
      githubUsername?: { [Op.iLike]: string };
    }[];
  } = {};

  // Add conditions if query parameters exist
  if (Boolean(submittedAt)) {
    condition.submittedAt = {
      [Op.gte]: new Date(submittedAt as string),
      [Op.lte]: new Date(submittedAt as string),
    };
  }
  if (Boolean(transcriptId)) {
    condition.transcriptId = { [Op.eq]: transcriptId };
  }
  if (Boolean(userId)) {
    condition.userId = { [Op.eq]: userId };
  }
  if (Boolean(mergedAt)) {
    condition.mergedAt = {
      [Op.gte]: new Date(mergedAt as string),
      [Op.lte]: new Date(mergedAt as string),
    };
  }

  if (userSearch) {
    const searchCondition = { [Op.iLike]: `%${userSearch.toLowerCase()}%` };
    userCondition[Op.or] = [
      { email: searchCondition },
      { githubUsername: searchCondition },
    ];
  }

  try {
    const reviews = await Review.findAll({
      where: condition,
      order: [["createdAt", "DESC"]],
      include: [
        { model: Transcript, required: true, attributes: { exclude: ["id"] } },
        {
          model: User,
          attributes: { exclude: ["id", "jwt", "albyToken"] },
          where: userCondition,
          required: true,
        },
      ],
    });

    const reviewCount = await Review.count({
      distinct: true,
      where: condition,
      include: [
        { model: Transcript, required: true,},
        {
          model: User,
          where: userCondition,
          required: true,
        },
      ],
    });

    const totalPages = Math.ceil(reviewCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      totalItems: reviewCount,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage,
      hasPreviousPage,
      data: reviews,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
};
