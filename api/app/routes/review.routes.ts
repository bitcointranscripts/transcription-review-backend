import type { Express } from "express";
import express from "express";
import * as reviews from "../controllers/review.controller";
import { auth } from "../middleware/auth";

export function reviewRoutes(app: Express) {
  const router = express.Router();

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
   *         name: status
   *         schema:
   *           type: string
   *           enum: ['active', 'pending', 'inactive']
   *         description: Filter reviews based on their status
   *     responses:
   *       200:
   *         description: The list of the reviews
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Review'
   *       404:
   *         description: User with username=${username} does not exist
   *       500:
   *         description: Some error occurred while retrieving reviews
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
   *
   * /api/reviews/{id}/submit:
   *   put:
   *    summary: Submit the review by the id
   *    tags: [Reviews]
   *    parameters:
   *      - in: path
   *        name: id
   *        schema:
   *          type: string
   *        required: true
   *        description: The transcript id
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              pr_url:
   *                type: string;
   *    responses:
   *      200:
   *        description: The review was submitted successfully
   *      400:
   *        description: pr_url is missing.
   *      404:
   *        description: Review was not found.
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

  // Submit a review with id
  router.put("/:id/submit", reviews.submit);

  app.use("/api/reviews", auth, router);
}

// export default reviewRoutes;
