const db = require("../sequelize/models");
const Review = db.review;
const Transcript = db.transcript;
const { ACTION_CLOSED, TRANCRIPT_QUEUED } = require("../utils/constants")


exports.create = async (req, res) => {
    const pull_request = req.body;

    //check if req.body return anything
    if (!pull_request) {
        res.status(500).send({
            message: "No pull request data found in the request body."
        })
    };

    const action = pull_request.action;
    const isMerged = pull_request.pull_request?.merged;
    const html_url = pull_request.pull_request?.html_url;
    const currentTime = new Date()

    // Check if the PR URL exists in the database
    const existingReview = await Review.findOne({ where: { pr_url: html_url } });

    if (!existingReview) {
        return res.status(404).send({
            message: `Review with pr_url=${html_url} not found`
        });
    }

    // Check if the action is closed and the PR is merged
    if (action === ACTION_CLOSED && isMerged) {
        try {
            // PR is merged, update the mergedAt timestamp
            existingReview.mergedAt = pull_request.pull_request.merged_at ?? currentTime;
            await existingReview.save();

            // find and update the associated transcript
            const associatedTranscript = await Transcript.findByPk(existingReview.transcriptId);
            associatedTranscript.archivedAt = currentTime
            await associatedTranscript.save()

            return res.sendStatus(200);
        } catch (error) {
            return res.status(500).send({
                message: `Error: ${error?.message ?? "unable to update review or associated transcript"}`
            })
        }
    } else if (action === ACTION_CLOSED && !isMerged) {
        try {
            // PR is merged, update the archivedAt timestamp
            existingReview.archivedAt = currentTime;
            await existingReview.save();

            // find and update the associated transcript
            const associatedTranscript = await Transcript.findByPk(existingReview.transcriptId);
            associatedTranscript.claimedBy = null;
            associatedTranscript.status = TRANCRIPT_QUEUED
            await associatedTranscript.save()

            res.sendStatus(200);
        } catch (error) {
            res.status(500).send({
                message: `Error: ${error?.message ?? "unable to update review or associated transcript"}`
            })
        }
    } else {
        res.sendStatus(200);
    }
};

