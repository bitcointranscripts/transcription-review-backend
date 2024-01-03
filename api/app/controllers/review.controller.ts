import { Request, Response } from "express";
import { Op } from "sequelize";

import { Review, Transaction, Transcript, User } from "../db/models";
import {
  DB_QUERY_LIMIT,
  DB_START_PAGE,
  QUERY_REVIEW_STATUS,
  HOUR_END_OF_DAY,
  MINUTE_END_OF_DAY,
  SECOND_END_OF_DAY,
  MILLISECOND_END_OF_DAY,
} from "../utils/constants";
import {
  buildIsActiveCondition,
  buildIsInActiveCondition,
  buildIsPendingCondition,
} from "../utils/review.inference";
import { parseMdToJSON } from "../helpers/transcript";
import axios from "axios";
import { BaseParsedMdContent, TranscriptAttributes } from "../types/transcript";


// THis function fetches and parses a transcript from a URL (already saved in the db which points to transcript on github), or returns the original transcript if no URL is provided. This is use to sync a transcript in review with the FE.
const transcriptWrapper = async (transcript: TranscriptAttributes, branchUrl?: string | undefined) => {
  // If there's no branchUrl, return the transcript as is
  if (!branchUrl) {
    return transcript;
  }

  // Create a copy of the transcript object to avoid modifying the original
  let newTranscript = { ...transcript };

  try {
    const response = await axios.get(branchUrl);
    const branchData = parseMdToJSON<BaseParsedMdContent>(response.data);
    // If the branchData doesn't have a body, return the transcript as is
    if (!branchData || !branchData.body) {
      return transcript;
    }
    newTranscript.content.body = branchData.body;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Error fetching or parsing branch data");
    }
  }

  return newTranscript;
}

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
      const transcript = await transcriptWrapper(data.transcript)
      return res.status(200).send({ ...data.dataValues, transcript })
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
  const transcriptId = Number(req.query.transcriptId);
  const userId = Number(req.query.userId);
  const mergedAt = req.query.mergedAt as string;
  const status = req.query.status as string;
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

  if (status) {
    const currentTime = new Date().getTime();
    switch (status) {
      case QUERY_REVIEW_STATUS.ACTIVE:
        const activeCondition = buildIsActiveCondition(currentTime);
        condition[Op.and as unknown as keyof typeof Op] = activeCondition;
        break;

      case "expired":
        const expiredCondition = buildIsInActiveCondition(currentTime);
        condition[Op.and as unknown as keyof typeof Op] = expiredCondition;
        break;

      case QUERY_REVIEW_STATUS.PENDING:
        const pendingCondition = buildIsPendingCondition();
        condition[Op.and as unknown as keyof typeof Op] = pendingCondition;
        break;

      default:
        break;
    }
  }

  // Check if the mergedAt parameter is provided in the query
  if (Boolean(mergedAt)) {
    // Convert the mergedAt string to a Date object
    const date = new Date(mergedAt as string);

    // Calculate the start of the day (00:00:00.000) for the mergedAt date
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Calculate the end of the day (23:59:59.999) for the mergedAt date
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      HOUR_END_OF_DAY,
      MINUTE_END_OF_DAY,
      SECOND_END_OF_DAY,
      MILLISECOND_END_OF_DAY
    );

    // Set the condition for mergedAt to filter records within the specified day
    condition.mergedAt = {
      [Op.gte]: startOfDay,
      [Op.lte]: endOfDay,
    };
  }

  if (Boolean(transcriptId)) {
    condition.transcriptId = { [Op.eq]: transcriptId };
  }
  if (Boolean(userId)) {
    condition.userId = { [Op.eq]: userId };
  }

  // Check if the mergedAt parameter is provided in the query for all time zone support
  if (Boolean(mergedAt)) {
    // Convert the mergedAt string to a Date object
    const date = new Date(mergedAt as string);

    // Calculate the start of the day (00:00:00.000) for the mergedAt date
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Calculate the end of the day (23:59:59.999) for the mergedAt date
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      HOUR_END_OF_DAY,
      MINUTE_END_OF_DAY,
      SECOND_END_OF_DAY,
      MILLISECOND_END_OF_DAY
    );

    // Set the condition for mergedAt to filter records within the specified day
    condition.mergedAt = {
      [Op.gte]: startOfDay,
      [Op.lte]: endOfDay,
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
        { model: Transcript, required: true },
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

export const getReviewsByPaymentStatus = async (
  req: Request,
  res: Response
) => {
  const status = (req.query.status as string)?.toLowerCase();

  if (!status) {
    return res.status(400).json({
      message: "status of 'paid' or 'unpaid' is required",
    });
  }

  const validStatuses = ["paid", "unpaid"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "status must be either 'paid' or 'unpaid'",
    });
  }

  try {
    const mergedReviews = await Review.findAll({
      where: { mergedAt: { [Op.not]: null } },
    });
    const allCreditTransactions = await Transaction.findAll({
      where: { transactionType: TRANSACTION_TYPE.CREDIT },
    });

    const creditTransactionReviewIds = allCreditTransactions.map(
      (transaction) => transaction.reviewId
    );
    const unpaidMergedReviews = mergedReviews.filter(
      (review) => !creditTransactionReviewIds.includes(review.id)
    );
    const paidMergedReviews = mergedReviews.filter((review) =>
      creditTransactionReviewIds.includes(review.id)
    );

    let response: {
      totalItems: number;
      data: Review[];
    } = {
      totalItems: 0,
      data: [],
    };

    if (status === "paid") {
      response = {
        totalItems: paidMergedReviews.length,
        data: paidMergedReviews,
      };
      return res.status(200).json(response);
    } else if (status === "unpaid") {
      response = {
        totalItems: unpaidMergedReviews.length,
        data: unpaidMergedReviews,
      };
      return res.status(200).json(response);
    }
  } catch (error) {
    Logger.error("Error in getting reviews by payment status", error);
    if (error instanceof Error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
};

export const resetReviews = async (req: Request, res: Response) => {
  const { id } = req.params; // Get the review ID from the request parameters

  try {
    // Find the review
    const review = await Review.findOne({ where: { id } });

    if (!review) {
      return res.status(404).send("Review not found");
    }

    // Reset the transcript
    await Transcript.update(
      { status: "queued", claimedBy: null },
      { where: { id: review.transcriptId } }
    );

    // Get the updated transcript
    const updatedTranscript = await Transcript.findOne({
      where: { id: review.transcriptId },
    });

    if (!updatedTranscript) {
      throw new Error("Transcript not found");
    }
    // Now you can use updatedTranscript.id

    // Delete the review
    await Review.destroy({ where: { id } });

    // Clear the Redis cache for the review
    redis.del(`review:${id}`, (err, succeeded) => {
      if (err) {
        throw err;
      }
      Logger.info(`Redis cache cleared for review ${id}: ${succeeded}`);
    });

    // Clear the Redis cache for the transcript
    redis.del(`transcript:${updatedTranscript.id}`, (err, succeeded) => {
      if (err) {
        throw err;
      }
      Logger.info(
        `Redis cache cleared for transcript ${updatedTranscript.id}: ${succeeded}`
      );
    });

    // Clear the Redis cache for the pages of transcripts
    const totalItems = await Transcript.count();
    const totalPages = Math.ceil(totalItems / DB_QUERY_LIMIT);
    for (let page = 1; page <= totalPages; page++) {
      redis.del(`transcripts:page:${page}`, (err, succeeded) => {
        if (err) {
          throw err;
        }
        Logger.info(
          `Redis cache cleared for transcripts page ${page}: ${succeeded}`
        );
      });
    }

    res.status(200).send("Reset successful");
  } catch (err) {
    res.status(500).send(`Error resetting review: ${err}`);
  }
};
