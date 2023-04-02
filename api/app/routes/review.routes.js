module.exports = app => {
  const reviews = require("../controllers/review.controller.js");

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
 * /api/reviews/{id}:
 *   get:
 *     summary: Get the review by id
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review id
 *     responses:
 *       200:
 *         description: The review response by id
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         description: The review was not found
 *   put:
 *    summary: Update the review by the id
 *    tags: [Reviews]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The review id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Review'
 *    responses:
 *      200:
 *        description: The review was updated successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Review'
 *      404:
 *        description: The review was not found
 *      500:
 *        description: Some error happened
 */
  // Create a new review
  router.post("/", reviews.create);

  // Retrieve all reviews
  router.get("/", reviews.findAll);

  // Retrieve a single review with id
  router.get("/:id", reviews.findOne);

  // Update a review with id
  router.put("/:id", reviews.update);

  app.use("/api/reviews", router);
};
