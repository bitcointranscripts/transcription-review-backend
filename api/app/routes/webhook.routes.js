module.exports = app => {
    const webhook = require("../controllers/review.controller.js");
  
    var router = require("express").Router();
  
  
    /**
   * @swagger
   * components:
   *   schemas:
   *     Review:
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
   *   name: Reviews
   *   description: The reviews API routes
   * /api/reviews:
   *   get:
   *     summary: Lists all the reviews
   *     tags: [Reviews]
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
   *     summary: Create a new review
   *     tags: [Reviews]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Review'
   *     responses:
   *       200:
   *         description: The created review.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Review'
   *       500:
   *         description: Some server error
   */

  
    // Create a new review
    router.post("/webhook", webhook.create);
  
    app.use("/api/webhook", router);
  };
  