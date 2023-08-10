import { Request, Response } from "express";
import { Op } from "sequelize";

import { Review, Transcript, User } from "../db/models";
import { TranscriptAttributes, TranscriptStatus } from "../types/transcript";
import { addToExpiryQueue } from "../utils/cron";
import {
  buildIsActiveCondition,
  buildIsPendingCondition,
  getTotalWords,
} from "../utils/review.inference";
import { MAXPENDINGREVIEWS } from "../utils/constants";
import { generateUniqueHash } from "../helpers/transcript";
import { redis } from "../db";
import {
  CACHE_EXPIRATION,
  deleteCache,
  resetRedisCachedPages,
} from "../db/helpers/redis";

// Create and Save a new Transcript
export async function create(req: Request, res: Response) {
  const { content } = req.body;
  // Validate request
  if (!content) {
    res.status(400).send({
      message: "Content cannot be empty!",
    });
    return;
  }

  // Create a Transcript
  const transcriptHash = generateUniqueHash(content);
  const totalWords = getTotalWords(content.body);
  const transcript: TranscriptAttributes = {
    originalContent: content,
    content: content,
    transcriptHash,
    status: TranscriptStatus.queued,
    contentTotalWords: totalWords,
  };

  // Save Transcript in the database
  await Transcript.create(transcript)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Transcript.",
      });
    });
}

// Retrieve all unarchived and queued transcripts from the database.
export async function findAll(req: Request, res: Response) {
  const page: number = Number(req.query.page) || 1;
  const limit: number = Number(req.query.limit) || 5;
  const offset: number = (page - 1) * limit;
  let condition = {
    [Op.and]: [
      { archivedAt: null },
      { archivedBy: null },
      { status: TranscriptStatus.queued },
    ],
  };

  try {
    const totalItems = await Transcript.count({ where: condition });
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // const cachedTranscriptIds = await redis.lrange("transcript", 0, -1);
    const cachedTranscriptIds = await redis.lrange(
      `transcripts:page:${page}`,
      0,
      -1
    );
    let cachedTranscripts: Transcript[] = [];

    if (cachedTranscriptIds.length > 0) {
      for (let transcriptId of cachedTranscriptIds) {
        let cachedTranscript = await redis.get(`transcript:${transcriptId}`);
        if (cachedTranscript) {
          const transcript = await JSON.parse(cachedTranscript);
          cachedTranscripts.push(transcript);
        }
      }

      if (cachedTranscripts.length > 0) {
        console.log("Using cached transcripts");
        const responseWithCachedResult = {
          totalItems,
          itemsPerPage: limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          data: cachedTranscripts,
        };
        return res.status(200).send(responseWithCachedResult);
      } else {
        await redis.del(`transcripts:page:${page}`);
      }
    }

    const data = await Transcript.findAll({
      where: condition,
      offset: offset,
      limit: limit,
      order: [["id", "ASC"]],
      attributes: {
        exclude: ["originalContent"],
      },
    });

    for (let transcript of data) {
      const transcriptData = transcript.dataValues;
      delete transcriptData.content.body;
      const stringifiedData = JSON.stringify(transcriptData);
      const transcriptId = transcriptData.id;
      if (!transcriptId) {
        continue;
      }

      await redis.sismember(
        "cachedTranscripts",
        transcriptId,
        async (err, isCached) => {
          if (err) {
            console.log(err);
          } else if (isCached === 0 || cachedTranscripts.length === 0) {
            const transaction = redis.multi();
            transaction
              .sadd("cachedTranscripts", transcriptId)
              .set(
                `transcript:${transcript.id}`,
                stringifiedData,
                "EX",
                CACHE_EXPIRATION
              )
              .rpush(`transcripts:page:${page}`, transcriptId);
            await transaction.exec((err, _results) => {
              if (err) {
                console.log(err);
              } else {
                console.log(transcriptId, "Transcript cached successfully");
              }
            });
          }
        }
      );
    }
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
          : "Some error occurred while retrieving transcript.",
    });
  }
}

// Find a single Transcript with an id
export async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!id) {
    res.status(400).send({
      message: "Transcript id cannot be empty!",
    });
    return;
  }

  await Transcript.findByPk(id)
    .then(async (data) => {
      if (data) {
        res.send(data);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send({
        message: "Could not find Transcript with id=" + id,
      });
    });
}

// Update a Transcript by the id in the request
export async function update(req: Request, res: Response) {
  const id = req.params.id;

  if (!req.body) {
    res.status(400).send({
      message: "Content cannot be empty!",
    });
    return;
  }

  try {
    //FIXME: Ensure only necessary fields are updated i.e. content, updatedAt
    await Transcript.update(req.body, {
      where: { id: id },
    }).then(async (response) => {
      if (response[0] === 1) {
        await resetRedisCachedPages();
        await deleteCache(`transcript:${id}`);
        await redis.srem("cachedTranscripts", id);
        return res.status(200).send({
          message: "Transcript was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`,
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      message: "Error updating Transcript with id=" + id,
    });
  }
}

// Archive a Transcript by the id in the request
export async function archive(req: Request, res: Response) {
  const {
    body: { archivedBy },
    params: { id },
  } = req;

  if (!archivedBy) {
    res.status(400).send({
      message: "ArchivedBy cannot be empty!",
    });
    return;
  }

  if (!id) {
    res.status(400).send({
      message: "Transcript id cannot be empty!",
    });
    return;
  }

  const userId = Number(archivedBy);

  const reviewer = await User.findByPk(userId);

  if (!reviewer || reviewer.permissions !== "admin") {
    res.status(403).send({
      message: "User unauthorized to archive transcripts.",
    });
    return;
  }

  try {
    const responseData = await Transcript.update(
      { archivedAt: new Date(), archivedBy: userId },
      {
        where: { id: Number(id) },
      }
    );
    if (responseData[0] === 0) {
      res.send({
        message: `Cannot archive Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`,
      });
    }
    const totalItems = await Transcript.count();
    const limit = 5;
    const totalPages = Math.ceil(totalItems / limit);
    for (let page = 1; page <= totalPages; page++) {
      await redis.del(`transcripts:page:${page}`);
    }
    await deleteCache(`transcript:${id}`);
    await redis.srem("cachedTranscripts", id);

    res.send({
      message: "Transcript was archived successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error archiving Transcript with id=" + id,
    });
  }
}

export async function claim(req: Request, res: Response) {
  const transcriptId = req.params.id;

  const uid = req.body.claimedBy;
  const currentTime = new Date().getTime();
  const activeCondition = buildIsActiveCondition(currentTime);
  const pendingCondition = buildIsPendingCondition();
  const userCondition = {
    userId: { [Op.eq]: uid },
  };

  const activeReview = await Review.findAll({
    where: { ...userCondition, ...activeCondition },
  });
  if (activeReview.length) {
    res.status(500).send({
      message:
        "Please finish editing & submit the transcript you're working on first",
    });
    return;
  }

  const pendingReview = await Review.findAll({
    where: { ...userCondition, ...pendingCondition },
  });
  if (pendingReview.length >= MAXPENDINGREVIEWS) {
    res.status(500).send({
      message: "User has too many pending reviews, clear some and try again!",
    });
    return;
  }

  const review = {
    userId: uid,
    transcriptId: Number(transcriptId),
  };

  try {
    const resp = await Transcript.update(
      {
        status: TranscriptStatus.not_queued,
        claimedBy: Number(req.body.claimedBy),
      },
      {
        where: { id: transcriptId },
      }
    );
    if (resp[0] === 0) {
      res.send({
        message: `Cannot claim Transcript with id=${transcriptId}. Maybe Transcript was not found or req.body is empty!`,
      });
    }
    const totalItems = await Transcript.count();
    const limit = 5;
    const totalPages = Math.ceil(totalItems / limit);
    for (let page = 1; page <= totalPages; page++) {
      await redis.del(`transcripts:page:${page}`);
    }
    await deleteCache(`transcript:${transcriptId}`);
    await redis.srem("cachedTranscripts", transcriptId);

    await Review.create(review)
      .then((data) => {
        res.send(data);
        addToExpiryQueue(data.id);
        return;
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Review.",
        });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error claiming Transcript with id=" + transcriptId,
    });
  }
}
