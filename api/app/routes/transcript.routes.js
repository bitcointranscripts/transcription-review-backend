module.exports = app => {
  const transcripts = require("../controllers/transcript.controller.js");

  var router = require("express").Router();

  /**
 * @swagger
 * components:
 *   schemas:
 *     Transcript:
 *       type: object
 *       properties:
 *         content:
 *           type: object
 *           description: Content to review
 *         originalContent:
 *           type: object
 *           description: Original content that should not be changed
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
 *         contens:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transcript'
 *       404:
 *         description: The transcript was not found
 *   put:
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
 */
 
  // Create a new transcript
  router.post("/", transcripts.create);

  // Retrieve all transcripts
  router.get("/", transcripts.findAll);

  // Retrieve a single transcript with id
  router.get("/:id", transcripts.findOne);

  // Update a transcript with id
  router.put("/:id", transcripts.update);

  app.use("/api/transcripts", router);
};
