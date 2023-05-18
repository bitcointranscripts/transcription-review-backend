module.exports = app => {
    const webhook = require("../controllers/review.controller.js");
  
    var router = require("express").Router();
  
  
    /**
   * @swagger
   * components:
   *   schemas:
   *     Webhook:
   *       type: object
   *       properties:
   *         userId:
   *           type: integer
   *           description: Id of the user who reviews the transcript
   *         transcriptId:
   *           type: integer
   *           description: Id of the transcript that gets reviewed
   */
  
    /**
   * @swagger
   * tags:
   *   name: Webhook
   *   description: The PR webhook route
   * /api/webhook:
   *   get:
   *     summary: Retrieves PR data from github webhook
   *     tags: [Webhook]
   *     parameters:
   *       - in: query
   *         name: username
   *         schema:
   *           type: string
   *         description: Filter reviews based on username
   *       - in: query
   *         name: userId
   *         schema:
   *           type: number
   *         description: Filter reviews based on userId
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter reviews based on whether they are active or not
   *     responses:
   *       200:
   *         description: The list of the reviews
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Review'
   *   post:
   *     summary: Post PR data from Github
   *     tags: [Webhook]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Webhook'
   *     responses:
   *       200:
   *         description: Receive webhook data.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Webhook'
   *       500:
   *         description: Some server error
   */

  
    // Create a new review
    router.post("/webhook", webhook.create);
  
    app.use("/api/webhook", router);
  };
  