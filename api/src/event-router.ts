import express, { Router, RequestHandler } from "express";
import { generateStreamUrl, createEvent, getEventById, getLiveEvents, joinEvent, getEventsByFilter } from './event-repository';

export const eventRouter: Router = express.Router();

/**
 * @swagger
 * /events:
 *   post:
 *     tags:
 *       - cookoff
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
eventRouter.post("/", async (req, res, next) => {
    try {
        const { mode, challengeType, difficulty } = req.body;
        const hostUserId = 1; // Placeholder for actual user ID from auth

        if (!mode || !challengeType || !difficulty) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        if (mode !== 'casual' && mode !== 'competitive') {
            res.status(400).json({ error: "Mode must be either 'casual' or 'competitive'" });
            return;
        }

        const streamUrl = generateStreamUrl();
        const eventId = await createEvent({
            mode: mode as 'casual' | 'competitive',
            challengeType,
            difficulty,
            hostUserId,
            streamUrl
        });
        res.status(201).json({ id: eventId, streamUrl });
    } catch (error) {
        console.error("Error creating event:", error);
        next(error);
    }
});

// --- Route Handler for GET /events ---
eventRouter.get("/", async (req, res, next) => {
    try {
        const modeQuery = req.query.mode as string | undefined;
        const statusQuery = req.query.status as string | undefined;
        let internalStatus: 'pending' | 'live' | 'ended';

        // Validate mode
        if (!modeQuery || (modeQuery !== 'casual' && modeQuery !== 'competitive')) {
            res.status(400).json({ error: "Invalid or missing 'mode' query parameter. Must be 'casual' or 'competitive'." });
            return;
        }

        // Validate and map status
        if (statusQuery === 'open') {
            internalStatus = 'pending';
        } else if (statusQuery === 'pending' || statusQuery === 'live' || statusQuery === 'ended') {
            internalStatus = statusQuery; // statusQuery is already one of 'pending', 'live', 'ended'
        } else {
            // This covers undefined, null, or any other invalid string for statusQuery
            res.status(400).json({ error: "Invalid or missing 'status' query parameter. Accepted values are 'open', 'pending', 'live', or 'ended'." });
            return;
        }

        // At this point, modeQuery and internalStatus are validated and correctly typed
        const events = await getEventsByFilter(modeQuery, internalStatus);
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events by filter:", error);
        next(error);
    }
});

/**
 * @swagger
 * /events/{id}/join:
 *   post:
 *     tags:
 *       - cookoff
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
eventRouter.post("/:id/join", async (req, res, next) => {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            res.status(400).json({ error: "Invalid event ID." });
            return;
        }
        const userId = 1; // Placeholder for actual user ID
        const { role } = req.body;

        if (!role || (role !== 'opponent' && role !== 'spectator')) {
            res.status(400).json({ error: "Role must be either 'opponent' or 'spectator'" });
            return;
        }

        const event = await getEventById(eventId);
        if (!event) {
            res.status(404).json({ error: "Event not found" });
            return;
        }
        if (event.status !== 'pending') {
            res.status(400).json({ error: "Cannot join an event that is not pending" });
            return;
        }
        if (role === 'opponent' && event.opponentUserId) {
            res.status(400).json({ error: "This event already has an opponent" });
            return;
        }

        await joinEvent(eventId, userId, role as 'opponent' | 'spectator');
        res.status(200).json({ message: `Successfully joined event as ${role}` });
    } catch (error) {
        console.error(`Error joining event:`, error);
        next(error);
    }
});

/**
 * @swagger
 * /events/live:
 *   get:
 *     tags:
 *       - cookoff
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
eventRouter.get("/live", async (req, res, next) => {
    try {
        const liveEvents = await getLiveEvents();
        res.status(200).json(liveEvents);
    } catch (error) {
        console.error("Error fetching live events:", error);
        next(error);
    }
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     tags:
 *       - cookoff
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
eventRouter.get("/:id", async (req, res, next) => {
    try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
            res.status(400).json({ error: "Invalid event ID." });
            return;
        }
        const event = await getEventById(eventId);
        if (!event) {
            res.status(404).json({ error: "Event not found" });
            return;
        }
        res.status(200).json(event);
    } catch (error) {
        console.error(`Error fetching event ${req.params.id}:`, error);
        next(error);
    }
});