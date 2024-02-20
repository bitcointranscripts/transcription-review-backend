import type { Express } from "express";
import express from "express";
import * as transactions from "../controllers/transaction.controller";
import { admin, auth } from "../middleware/auth";

export function transactionRoutes(app: Express) {
  const router = express.Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     Transaction:
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
   *   name: Transactions
   *   description: The transactions API routes
   * /api/transactions:
   *   get:
   *     summary: List of all transactions of a user
   *     tags: [Transactions]
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: number
   *         description: Filter transactions based on userId
   *       - in: query
   *         name: transactionStatus
   *         schema:
   *           type: string
   *           enum: ['success', 'failed', 'pending']
   *         description: Filter transactions based on their status
   *       - in: query
   *         name: transactionType
   *         schema:
   *           type: string
   *           enum: ['credit', 'debit']
   *         description: Filter transactions based on their type
   *     responses:
   *       200:
   *         description: The list of the reviews
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transactions'
   *       404:
   *         description: Could not create transaction
   *       500:
   *         description: Some error occurred while retrieving reviews
   *   post:
   *     summary: Create a new transaction
   *     tags: [Transactions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Transactions'
   *     responses:
   *       200:
   *         description: The created transaction.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Transactions'
   *       500:
   *         description: Some server error
   */

  /**
   * @swagger
   * /api/transactions/credit:
   *   post:
   *     security:
   *       - bearerAuth: []
   *     summary: process unpaid review transactions
   *     tags: [Transactions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *           properties:
   *             reviewId:
   *               type: integer
   *               description: Id of the review to process unpaid transaction
   *     responses:
   *       200:
   *         description: The response for processing unpaid review transactions
   *       404:
   *         description: Bad request
   *       500:
   *         description: Error processing unpaid review transaction
   */

  // Get Transaction
  router.get("/", transactions.findAll);

  // Create a new Transaction
  router.post("/", transactions.create);

  // Get all Transactions for Admin
  router.get("/all", admin, transactions.getAllTransactions);

  // Process unpaid review transactions
  router.post("/credit", admin, transactions.processUnpaidReviewTransaction);

  app.use("/api/transactions", auth, router);
}
