import express, { Router } from "express";
import { EventController } from '../controller/event.controller';

export const eventRouter: Router = express.Router();
const eventController = new EventController();

/**
 * @swagger
 * tags:
 *   name: Cookoff
 *   description: API endpoints for managing cooking events
 */

/**
 * @swagger
 * /events:
 *   post:
 *     tags: [Cookoff]
 *     summary: Create a new cooking event
 *     description: Creates a new cooking event (casual or competitive)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - challengeType
 *               - difficulty
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [casual, competitive]
 *                 description: Event mode
 *               challengeType:
 *                 type: string
 *                 description: Type of cooking challenge
 *               difficulty:
 *                 type: string
 *                 description: Difficulty level of the challenge
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The event ID
 *                 streamUrl:
 *                   type: string
 *                   description: URL for the streaming session
 */
eventRouter.post("/", eventController.createNewEvent);

/**
 * @swagger
 * /events:
 *   get:
 *     tags: [Cookoff]
 *     summary: Get events by filter
 *     description: Retrieves a list of cooking events based on specified mode and status filters.
 *     parameters:
 *       - in: query
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [casual, competitive]
 *         description: The mode of the events to filter by (casual or competitive).
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [open, pending, live, ended]
 *         description: The status of the events to filter by. 'open' maps to 'pending' internally.
 *     responses:
 *       200:
 *         description: A list of events matching the filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object # Define a more specific event schema if available or needed
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The event ID.
 *                   mode:
 *                     type: string
 *                     enum: [casual, competitive]
 *                     description: Event mode.
 *                   challengeType:
 *                     type: string
 *                     description: Type of cooking challenge.
 *                   difficulty:
 *                     type: string
 *                     description: Difficulty level.
 *                   status:
 *                     type: string
 *                     enum: [pending, live, ended]
 *                     description: Current status of the event.
 *                   hostUserId:
 *                     type: integer
 *                     description: ID of the host user.
 *                   opponentUserId:
 *                     type: integer
 *                     nullable: true
 *                     description: ID of the opponent user, if any.
 *                   streamUrl:
 *                     type: string
 *                     description: URL for the streaming session.
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     description: Timestamp when the event started or is scheduled to start.
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     description: Timestamp when the event ended.
 *       400:
 *         description: Invalid or missing query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing 'mode' query parameter. Must be 'casual' or 'competitive'."
 *       500:
 *         description: Internal server error.
 */
eventRouter.get("/", eventController.getFilteredEvents);

/**
 * @swagger
 * /events/{id}/join:
 *   post:
 *     tags: [Cookoff]
 *     summary: Join an event as participant or spectator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [opponent, spectator]
 *     responses:
 *       200:
 *         description: Successfully joined event
 */
eventRouter.post("/:id/join", eventController.joinExistingEvent);

/**
 * @swagger
 * /events/live:
 *   get:
 *     tags: [Cookoff]
 *     summary: Get all live events
 *     description: Returns a list of currently live cooking events
 *     responses:
 *       200:
 *         description: A list of live events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   mode:
 *                     type: string
 *                   hostName:
 *                     type: string
 *                   opponentName:
 *                     type: string
 *                   challengeType:
 *                     type: string
 *                   difficulty:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   streamUrl:
 *                     type: string
 *                   spectatorCount:
 *                     type: integer
 */
eventRouter.get("/live", eventController.getAllLiveEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     tags: [Cookoff]
 *     summary: Get details of a specific event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
eventRouter.get("/:id", eventController.getEventDetailsById);