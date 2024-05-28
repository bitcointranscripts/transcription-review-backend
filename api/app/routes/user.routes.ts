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
   * /api/users/signin:
   *   post:
   *     security:
   *        - apiKeyAuth: []
   *     tags: [Users]
   *     summary: Creates or signs in a user.
   *     description: Creates or signs in a user. If the user is already in the database, the user is signed in. If the user is not in the database, the user is created and signed in.
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              email:
   *                type: string
   *                description: The user's Github email.
   *                example: example@email.com
   *                required: true
   *     responses:
   *       200:
   *         description: Successfully signed in
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                    jwt:
   *                      type: string
   *                      description: The user's JWT token.
   *                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiZXhhbXBsZUBlbWFpbC5jb20iLCJwZXJtaXNzaW9ucyI6ImFkbWluIiwiaWF0IjoxNjI5MjIwNjI4LCJleHAiOjE2MjkzMDcxMjh9.
   *       500:
   *         description: An error occurred while signing in.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                  message:
   *                   type: string
   *                   example: Unable to sign in. Some error occurred while signing in.
   */
   router.post("/signin", validateGitHubToken, users.signIn);
  

  // Retrieve all users
  /**
   * @swagger
   * /api/users:
   *   get:
   *     security:
   *      - bearerAuth: []
   *     tags: [Users]
   *     summary: Retrieve a list of users.
   *     description: Retrieve a list of users. Accessible only to admins. The data returned exculdes the user's JWT token, email, and updatedAt date.
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
   */
  router.get("/", auth, admin, users.findAll);

  // Retrieve a single User by their public profile (Github username)
  /**
   * @swagger
   * /api/users/public:
   *   get:
   *     security:
   *       - bearerAuth: []
   *     tags: [Users]
   *     summary: Retrieve a single user by their username.
   *     description: Retrieve a single user by their username. The data returned is limited to the user's Github username, permissions, and archivedAt date.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *          schema:
   *           type: object
   *           properties:
   *            username:
   *              type: string
   *              description: The user's Github username.
   *              example: ryanofsky
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
   *     security:
   *      - bearerAuth: []
   *     tags: [Users]
   *     summary: Retrieve a single user.
   *     description: Retrieve a single user. Returns all user data.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID of the user to retrieve.
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
