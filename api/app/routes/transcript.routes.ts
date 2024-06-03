import type { Express } from "express";
import express from "express";
import * as transcripts from "../controllers/transcript.controller";
import { auth, authorizeRoles } from "../middleware/auth";
import { USER_PERMISSIONS } from "../types/user";

export function transcriptRoutes(app: Express) {
  const router = express.Router();

  /**
   * @swagger
   * components:
   *   securitySchemes:
   *    bearerAuth:
   *      type: http
   *      scheme: bearer  
   *   schemas:
   *     Archive:
   *       type: object
   *       properties:
   *         archivedBy:
   *           type: int
   *           description: Id of the user archiving the transcript
   *     Transcript:
   *       type: object
   *       properties:
   *         content:
   *           type: object
   *           description: Content to review
   *         originalContent:
   *           type: object
   *           description: Original content that should not be changed
   * security:
   *  - bearerAuth: []
   */

  /**
   * @swagger
   * tags:
   *   name: Transcripts
   *   description: The transcripts managing API
   * /api/transcripts:
   *   get:
   *     summary: Lists all the transcripts
   *     tags: [Transcripts]
   *     responses:
   *       200:
   *         description: The list of the transcripts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transcript'
   *   post:
   *     security:
   *       - bearerAuth: []
   *     summary: Create a new transcript
   *     tags: [Transcripts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Transcript'
   *     responses:
   *       200:
   *         description: The created transcript.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transcript'
   *       500:
   *         description: Some server error
   * /api/transcripts/{id}:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     summary: Get the transcript by id
   *     tags: [Transcripts]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The transcript id
   *     responses:
   *       200:
   *         description: The transcript response by id
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transcript'
   *       404:
   *         description: The transcript was not found
   *   put:
   *    security:
   *      - bearerAuth: []
   *    summary: Update the transcript by the id
   *    tags: [Transcripts]
   *    parameters:
   *      - in: path
   *        name: id
   *        schema:
   *          type: string
   *        required: true
   *        description: The transcript id
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/Transcript'
   *    responses:
   *      200:
   *        description: The transcript was updated successfully
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/Transcript'
   *      404:
   *        description: The transcript was not found
   *      500:
   *        description: Some error happened
   * /api/transcripts/{id}/archive:
   *   put:
   *    security:
   *      - bearerAuth: []
   *    summary: Archive the transcript by the id
   *    tags: [Transcripts]
   *    parameters:
   *      - in: path
   *        name: id
   *        schema:
   *          type: string
   *        required: true
   *        description: The transcript id
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/Archive'
   *    responses:
   *      200:
   *        description: The transcript was updated successfully
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/Transcript'
   *      403:
   *        description: User unauthorized to archive transcript
   *      500:
   *        description: Some error happened
   * /api/transcripts/{id}/claim:
   *   put:
   *    security:
   *      - bearerAuth: []
   *    summary: Claim the transcript by the id
   *    tags: [Transcripts]
   *    parameters:
   *      - in: path
   *        name: id
   *        schema:
   *          type: string
   *        required: true
   *        description: The transcript id
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *    responses:
   *      200:
   *        description: The transcript was claimed successfully
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/Transcript'
   *      403:
   *        description: User already has a transcript claimed.
   *      500:
   *        description: Some error happened
   */

  // Create a new transcript
  router.post("/", auth, authorizeRoles([USER_PERMISSIONS.ADMIN]), transcripts.create);

  // Retrieve all transcripts
  router.get("/", transcripts.findAll);

  // Retrieve a single transcript with id
  router.get("/:id", auth, transcripts.findOne);

  // Update a transcript with id
  router.put("/:id", auth, transcripts.update);

  // Archive a transcript with id
  router.put("/:id/archive", auth, authorizeRoles([USER_PERMISSIONS.ADMIN]), transcripts.archive);

  // Claim a transcript with id
  router.put("/:id/claim", auth, transcripts.claim);

  app.use("/api/transcripts", router);
}
