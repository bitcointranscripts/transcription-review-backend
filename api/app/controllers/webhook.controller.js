const db = require("../sequelize/models");
const User = db.user;
const Review = db.review;
const Transcript = db.transcript;
const Op = db.Sequelize.Op;


exports.create = async (req, res) => {
    // const action = req.headers["x-github-event"];
    const pull_request = req.body;
     const action = pull_request.action;


    // Check if it's a pull request event
const PR_EVENTS = {
opened: "opened",
closed: "closed",
sync: "synchronize",
} as const
    if (action === PR_EVENTS.opened || ......) {
        const html_url = pull_request.pull_request.html_url;

        console.log(`Received pull request event for PR: ${html_url}`);

        try {
            // Check if the PR URL exists in the database
            const existingReview = await Transcript.findOne({ where: { pr_url: html_url } });

            if (existingReview) {
                // PR is merged, update the mergeAt timestamp
                existingReview.mergedAt = new Date();
                existingReview.archivedAt = new Date();

                await existingReview.save();

                console.log(`Review with PR URL ${html_url} updated successfully.`);
            } else {
                console.log(`Review with PR URL ${html_url} not found in the database.`);
            }
        } catch (error) {
            console.error('Error occurred while updating the review:', error);
        }

        res.sendStatus(200);
    } else {
        // Not a pull request event
        res.sendStatus(204);
    }


};


