import type { Express } from "express";
import express from "express";
import * as users from "../controllers/user.controller";
import { auth } from "../middleware/auth";
import validateGitHubToken from "../middleware/validate-github-token";

export function userRoutes(app: Express) {
  const router = express.Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     User:
   *       type: object
   *       properties:
   *         username:
   *           type: string
   *           description: The user's github username.
   *           example: glozow
   *         permissions:
   *           type: string
   *           description: The user's permissions.
   *           enum: [admin, reviewer]
   */
  // Create a new User

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a JSONPlaceholder user.
   *     responses:
   *       201:
   *         description: Created
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
  router.post("/signup", users.signUp);

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
  router.get("/", users.findAll);

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
   *  tags: [Users]
   *  put:
   *    summary: Updates a JSONPlaceholder user.
   *    description: Updates a single JSONPlaceholder user. Can be used to update a user profile when prototyping or testing an API.
   *    parameters:
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: integer
   *        description: Numeric ID of the user to update.
   *      - in: query
   *        name: username
   *        required: true
   *        schema:
   *          type: string
   *        description: The user's github username.
   *    responses:
   *      200:
   *        description: Update the records of a single user.
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
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
  router.put("/:id", auth, users.update);

  app.use("/api/users", router);
}
