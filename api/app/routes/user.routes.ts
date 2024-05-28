import type { Express } from "express";
import express from "express";
import * as users from "../controllers/user.controller";
import { admin, auth } from "../middleware/auth";
import validateGitHubToken from "../middleware/validate-github-token";

export function userRoutes(app: Express) {
  const router = express.Router();

  // Sign in a user

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a JSONPlaceholder user.
   *     responses:
   *       200:
   *         description: Successfully signed in
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     username:
   *                       type: string
   *                       description: The user's github username.
   *                       example: glozow
   *                     permissions:
   *                       type: string
   *                       description: The user's permissions.
   *                       enum: [admin, reviewer]
   */
   router.post("/signin", validateGitHubToken, users.signIn);
  

  // Retrieve all users
  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Retrieve a list of JSONPlaceholder users.
   *     description: Retrieve a list of users from JSONPlaceholder. Can be used to populate a list of fake users when prototyping or testing an API.
   *     responses:
   *       200:
   *         description: A list of users.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         description: The user ID.
   *                         example: 1
   *                       githubUsername:
   *                         type: string
   *                         description: The user's Github username.
   *                         example: ryanofsky
   *                       authToken:
   *                         type: string
   *                         description: The user's authentication token.
   *                         example: Thsdfk3j3kflfjdkfjfj
   *                       permissions:
   *                         type: string
   *                         description: The user's permissions.
   *                         enum: [admin, reviewer]
   *                       archivedAt:
   *                         type: datetime
   *                         description: Date when a user is marked as inactive.
   *                         example: 2023-03-08T13:42:08.699Z
   *                       createdAt:
   *                         type: datetime
   *                         description: Date when a user is created
   *                         example: 2023-03-08T13:42:08.699Z
   *                       updatedAt:
   *                         type: datetime
   *                         description: Date when a user record is updated.
   *                         example: 2023-03-08T13:42:08.699Z
   */
  router.get("/", auth, admin, users.findAll);

  // Retrieve a single User by their public profile (Github username)
  /**
   * @swagger
   * /api/users/public:
   *   get:
   *     summary: Retrieve a single JSONPlaceholder user.
   *     description: Retrieve a single JSONPlaceholder user.
   *     parameters:
   *       - in: query
   *         name: username
   *         required: true
   *         schema:
   *            type: string
   *         description: The user's github username.
   *     responses:
   *       200:
   *         description: A single user.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       description: The user ID only if the request is made by an admin.
   *                       example: 1
   *                     githubUsername:
   *                       type: string
   *                       description: The user's Github username.
   *                       example: ryanofsky
   *                     permissions:
   *                       type: string
   *                       description: The user's permissions.
   *                       enum: [admin, reviewer]
   *                     archivedAt:
   *                       type: datetime
   *                       description: Date when a user is marked as inactive.
   *                       example: 2023-03-08T13:42:08.699Z
   *                     createdAt:
   *                       type: datetime
   *                       description: Date when a user is created
   *                       example: 2023-03-08T13:42:08.699Z
   */
  router.get("/public", auth, users.findByPublicProfile);

  // Retrieve a single User with id
  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Retrieve a single JSONPlaceholder user.
   *     description: Retrieve a single JSONPlaceholder user. Can be used to populate a user profile when prototyping or testing an API.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: Numeric ID of the user to retrieve.
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: A single user.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       description: The user ID.
   *                       example: 1
   *                     githubUsername:
   *                       type: string
   *                       description: The user's Github username.
   *                       example: ryanofsky
   *                     authToken:
   *                       type: string
   *                       description: The user's authentication token.
   *                       example: Thsdfk3j3kflfjdkfjfj
   *                     permissions:
   *                       type: string
   *                       description: The user's permissions.
   *                       enum: [admin, reviewer]
   *                     archivedAt:
   *                       type: datetime
   *                       description: Date when a user is marked as inactive.
   *                       example: 2023-03-08T13:42:08.699Z
   *                     createdAt:
   *                       type: datetime
   *                       description: Date when a user is created
   *                       example: 2023-03-08T13:42:08.699Z
   *                     updatedAt:
   *                       type: datetime
   *                       description: Date when a user record is updated.
   *                       example: 2023-03-08T13:42:08.699Z
   */
  router.get("/:id", auth, users.findOne);

  router.get("/:id/reviews", auth, users.getUserReviews);

  // Get a user wallet details
  router.get("/:id/wallet", auth, users.getUserWallet);

  // Update a user with id
  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *    security:
   *       - bearerAuth: []
   *    tags: [Users]
   *    summary: Updates a user profile.
   *    description: Updates a user profile. Accessible only to admins. Can be used to update user permissions or Github username or both.
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        description: ID of the user to update.
   *        schema:
   *         type: integer
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *         schema:
   *          type: object
   *          properties:
   *           permissions:
   *              type: string
   *              description: The user's permissions - either "admin" or "reviewer" or "evaluator".
   *              enum: [admin, reviewer, evaluator]
   *           githubUsername:
   *              type: string
   *              description: The user's Github username.
   *              example: adamJonas
   *    responses:
   *      200:
   *        description: Update the records of a single user.
   *        content:
   *          application/json:
   *           schema:
   *            type: String
   *            example: User updated successfully
   *      404:
   *        description: The user was not found.
   *        content:
   *          application/json:
   *           schema:
   *            type: String
   *            example: User not found
   *      400:
   *        description: The user id is missing or the username is missing.
   *        content:
   *          application/json:
   *            schema:
   *             type: String
   *             example: Either permissions or githubUsername should be present!
   *      500:
   *        description: An error occurred while updating the user.
   *        content:
   *          application/json:
   *           schema:
   *            type: String
   *            example: Cannot update User with id=1.
   */
  router.put("/:id", auth, admin, users.update);

  app.use("/api/users", router);
}
