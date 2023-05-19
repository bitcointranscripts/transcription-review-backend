const db = require("../sequelize/models");
const Review = db.review;
const { ACTION_CLOSED } = require("../utils/constants")


exports.create = async (req, res) => {
    const pull_request = req.body;

    //check if req.body return anything
    if (!pull_request) {
        throw new Error("No pull request data found in the request body.");
    };

    const action = pull_request.action;
    const isMerged = pull_request.pull_request.merged;

    // Check if the action is open
    if (action === ACTION_CLOSED && isMerged === true) {
        const html_url = pull_request.pull_request.html_url;
        try {
            // Check if the PR URL exists in the database
            const existingReview = await Review.findOne({ where: { pr_url: html_url } });
            if (existingReview) {
                // PR is merged, update the mergeAt timestamp
                existingReview.mergedAt = new Date();

                await existingReview.save();
                res.sendStatus(200);
            } else {
                throw new Error(`Review with PR URL ${html_url} not found.`);
            }
        } catch (error) {
            throw new Error(error);
        }
    } else if (action === ACTION_CLOSED && isMerged === false) {
        const html_url = pull_request.pull_request.html_url;
        try {
            // Check if the PR URL exists in the database
            const existingReview = await Review.findOne({ where: { pr_url: html_url } });
            if (existingReview) {
                // PR is merged, update the mergeAt timestamp
                existingReview.archivedAt = new Date();

                await existingReview.save();
                res.sendStatus(200);
            } else {
                throw new Error(`Review with PR URL ${html_url} not found.`);
            }
        } catch (error) {
            throw new Error(error);
        }
    } else {
        res.sendStatus(200);
    }
};

