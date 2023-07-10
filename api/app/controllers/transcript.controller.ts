import { Request, Response } from "express";
import { Op } from "sequelize";

import { Review, Transcript, User } from "../db/models";
import { TranscriptStatus } from "../types/transcript";
import { setupExpiryTimeCron } from "../utils/cron";
import {
  buildIsActiveCondition,
  buildIsPendingCondition,
  calculateWordDiff,
} from "../utils/review.inference";
import { MAXPENDINGREVIEWS } from "../utils/constants";

// Create and Save a new Transcript
export function create(req: Request, res: Response) {
  const { content } = req.body;
  // Validate request
  if (!content) {
    res.status(400).send({
      message: "Content cannot be empty!",
    });
    return;
  }

  const getFirstFiveWords = (paragraph: string) => {
    const words = paragraph.trim().split(/\s+/);
    return words.slice(0, 5).join(" ");
  };

  const generateUniqueStr = () => {
    const oc = content;
    const str = oc.title + getFirstFiveWords(oc.body);
    const transcriptHash = str.trim().toLowerCase();

    return transcriptHash;
  };

  // Create a Transcript
  const transcript = {
    originalContent: content,
    content: content,
    transcriptHash: generateUniqueStr(),
    status: TranscriptStatus.not_queued,
  };

  // Save Transcript in the database
  Transcript.create(transcript)
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
export function findAll(req: Request, res: Response) {
  let condition = {
    [Op.and]: [
      { archivedAt: null },
      { archivedBy: null },
      { status: TranscriptStatus.not_queued },
    ],
  };

  Transcript.findAll({ where: condition })
    .then((data) => {
      const transcripts: Transcript[] = [];
      const appendTotalWords = data.map(async (transcript) => {
        const transcriptData = transcript.dataValues;
        const { totalWords } = await calculateWordDiff(transcriptData);
        Object.assign(transcriptData, { contentTotalWords: totalWords });
        transcripts.push(transcript);
      });
      Promise.all(appendTotalWords).then(() => {
        res.send(transcripts);
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transcript.",
      });
    });
}

// Find a single Transcript with an id
export async function findOne(req: Request, res: Response) {
  const id = Number(req.params.id);

  await Transcript.findByPk(id)
    .then(async (data) => {
      if (data) {
        const { totalWords } = await calculateWordDiff(data);
        Object.assign(data.dataValues, {
          contentTotalWords: totalWords,
        });
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
export function update(req: Request, res: Response) {
  const id = req.params.id;

  //FIXME: Ensure only necessary fields are updated i.e. content, updatedAt
  Transcript.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (typeof num === "number" && num == 1) {
        res.send({
          message: "Transcript was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Transcript with id=${id}. Maybe Transcript was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Transcript with id=" + id,
      });
    });
}

// Archive a Transcript by the id in the request
export async function archive(req: Request, res: Response) {
  const {
    body: { archivedBy },
    params: { id },
  } = req;

  const userId = Number(archivedBy);

  const reviewer = await User.findByPk(userId);

  if (!reviewer || reviewer.permissions !== "admin") {
    res.status(403).send({
      message: "User unauthorized to archive transcripts.",
    });
    return;
  }

  Transcript.update(
    { archivedAt: new Date(), archivedBy: userId },
    {
      where: { id: Number(id) },
    }
  )
    .then((num) => {
      res.send({
        message: "Transcript was archived successfully.",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        message: "Error archiving Transcript with id=" + id,
      });
    });
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
    res.status(403).send({
      message: "Cannot claim transcript, user has an active review",
    });
    return;
  }

  const pendingReview = await Review.findAll({
    where: { ...userCondition, ...pendingCondition },
  });
  if (pendingReview.length >= MAXPENDINGREVIEWS) {
    res.status(403).send({
      message: "User has too many pending reviews, clear some and try again!",
    });
    return;
  }

  const review = {
    userId: uid,
    transcriptId: Number(transcriptId),
  };

  await Transcript.update(
    {
      status: TranscriptStatus.not_queued,
      claimedBy: Number(req.body.claimedBy),
    },
    {
      where: { id: transcriptId },
    }
  )
    .then((num) => {
      if (typeof num === "number" && num == 1) {
        // Save review in the database
        Review.create(review)
          .then((data) => {
            res.send(data);
            setupExpiryTimeCron(data);
          })
          .catch((err) => {
            res.status(500).send({
              message:
                err.message || "Some error occurred while creating the review.",
            });
          });
      } else {
        res.send({
          message: `Cannot claim Transcript with id=${transcriptId}. Maybe Transcript was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error claiming Transcript with id=" + transcriptId,
      });
    });
}
