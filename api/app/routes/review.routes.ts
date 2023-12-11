import type { Express } from "express";
import express from "express";
import * as reviews from "../controllers/review.controller";
import { admin, auth } from "../middleware/auth";

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
   * 
   *     Pagination:
   *       type: integer
   *       minimum: 1
   *       default: 1
   */

  /**
   * @swagger
   * tags:
   *   name: Reviews
   *   description: The reviews API routes
   */

  /**
   * @swagger
   * /api/reviews:
   *   get:
   *     security:
   *       - bearerAuth: []
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
   *         description: The list of reviews
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Review'
   *       404:
   *         description: User with specified username does not exist
   *       500:
   *         description: Some error occurred while retrieving reviews
   */

  /**
   * @swagger
   * /api/reviews:
   *   post:
   *     security:
   *       - bearerAuth: []
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

  /**
   * @swagger
   * /api/reviews/{id}:
   *   get:
   *     security:
   *       - bearerAuth: []
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Review'
   *       404:
   *         description: The review was not found
   *       500:
   *         description: Some error happened
   */

  /**
   * @swagger
   * /api/reviews/{id}:
   *   put:
   *     security:
   *       - bearerAuth: []
   *     summary: Update the review by the id
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The review id
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Review'
   *     responses:
   *       200:
   *         description: The review was updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Review'
   *       404:
   *         description: The review was not found
   *       500:
   *         description: Some error happened
   */

  /**
   * @swagger
   * /api/reviews/{id}/submit:
   *   put:
   *     security:
   *       - bearerAuth: []
   *     summary: Submit the review by the id
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The transcript id
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pr_url:
   *                 type: string;
   *     responses:
   *       200:
   *         description: The review was submitted successfully
   *       400:
   *         description: pr_url is missing.
   *       404:
   *         description: Review was not found.
   *       500:
   *         description: Some error happened
   */

  /**
   * @swagger
   * /api/reviews/all:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Filter reviews for admins
   *     tags: [Reviews]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [expired, pending, active]
   *         description: Filter reviews based on status
   *       - in: query
   *         name: transcriptId
   *         schema:
   *           type: integer
   *         description: Filter reviews based on transcriptId
   *       - in: query
   *         name: userId
   *         schema:
   *           type: integer
   *         description: Filter reviews based on userId
   *       - in: query
   *         name: user
   *         schema:
   *           type: string
   *         description: Filter reviews based on email and username
   *       - in: query
   *         name: mergedAt
   *         schema:
   *           type: string
   *         description: Filter reviews based on mergedAt
   *       - in: query
   *         name: page
   *         schema:
   *           $ref: '#/components/schemas/Pagination'
   *     responses:
   *       200:
   *         description: The list of reviews
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Review'
   *       404:
   *         description: Review was not found.
   *       500:
   *         description: Some error happened
   */

  // Create a new review
  router.post("/", reviews.create);

  // Retrieve all reviews
  router.get("/", reviews.findAll);

  // Retrieve reviews for admin
  router.get("/all", admin, reviews.getAllReviewsForAdmin);

  // Retrieve a single review with id
  router.get("/:id", reviews.findOne);

  // Update a review with id
  router.put("/:id", reviews.update);

  // Submit a review with id
  router.put("/:id/submit", reviews.submit);

  app.use("/api/reviews", auth, router);
}
