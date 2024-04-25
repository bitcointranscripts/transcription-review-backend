import { Request, Response } from "express";
import { Op } from "sequelize";

import { Review, Transaction, Transcript, User } from "../db/models";
import { DB_QUERY_LIMIT, DB_START_PAGE } from "../utils/constants";
import { buildCondition, buildReviewResponse } from "../utils/review.inference";
import { parseMdToJSON } from "../helpers/transcript";
import axios from "axios";
import { BaseParsedMdContent, TranscriptAttributes } from "../types/transcript";
import { redis } from "../db";
import { Logger } from "../helpers/logger";
import { TRANSACTION_TYPE } from "../types/transaction";

// THis function fetches and parses a transcript from a URL (already saved in the db which points to transcript on github), or returns the original transcript if no URL is provided. This is use to sync a transcript in review with the FE.
const transcriptWrapper = async (
  transcript: TranscriptAttributes,
  branchUrl?: string | undefined
) => {
  // If there's no branchUrl, return the transcript as is
  if (!branchUrl) {
    return transcript;
  }

  // Create a copy of the transcript object to avoid modifying the original
  let newTranscript = { ...transcript };

  try {
    const response = await axios.get(branchUrl, {
      headers: { Accept: "application/vnd.github.v3.raw" },
    });
    const branchData = parseMdToJSON<BaseParsedMdContent>(response.data);
    // If the branchData doesn't have a body, return the transcript as is
    if (!branchData || !branchData.body) {
      return transcript;
    }
    newTranscript.content = branchData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Error fetching or parsing branch data");
    }
  }

  return newTranscript;
};

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
  const queryStatus = req.query.status as string | undefined;
  const userId = Number(req.body.userId);
  const page: number = Number(req.query.page) || DB_START_PAGE;
  const limit: number = Number(req.query.limit) || DB_QUERY_LIMIT;
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

  const { condition } = buildCondition({
    status: queryStatus,
    userId: user.id,
  });

  try {
    const totalItems = await Review.count({
      where: condition,
    });

    const data = await Review.findAll({
      where: condition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: { model: Transcript },
    });

    const response = buildReviewResponse(data, page, limit, totalItems);

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

  try {
    const data = await Review.findOne({
      where: { id: id, userId: userId },
      include: { model: Transcript },
    });

    if (!data) {
      return res.status(404).send({
        message: `Review with id=${id} does not exist`,
      });
    }

    const branchUrl = data.branchUrl;
    const transcriptData = data.transcript.dataValues;
    const transcript = await transcriptWrapper(transcriptData, branchUrl);
    return res.status(200).send({ ...data.dataValues, transcript });
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving review with id=" + id,
    });
  }
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
  const submittedAt = req.query.submittedAt as string;
  const status = req.query.status as string;
  const userSearch = req.query.user as string;
  const page: number = Number(req.query.page) || DB_START_PAGE;
  const limit: number = Number(req.query.limit) || DB_QUERY_LIMIT;
  const offset = Math.max(0, (page - 1) * limit);

  const { condition, userCondition } = buildCondition({
    status,
    transcriptId,
    userId,
    mergedAt,
    userSearch,
    submittedAt,
  });

  try {
    const reviews = await Review.findAll({
      where: condition,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
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

    const response = buildReviewResponse(reviews, page, limit, reviewCount);

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
