import express from "express";
import { generateStreamUrl, createEvent,addEventMessage, getEventById,getLiveEvents,joinEvent } from './event-repository';

export const eventRouter = express.Router();

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
// TODO: Implement authentication and user id 
eventRouter.post("/", /*authenticateJWT,*/ async (req, res) => {
    try {
        const { mode, challengeType, difficulty } = req.body;
        const hostUserId = 1;//req.user.id; // From authenticateJWT middleware

        // Validate required fields
        if (!mode || !challengeType || !difficulty) {
            res.status(400).json({ error: "Missing required fields" });
        } else {


            // Validate mode
            if (mode !== 'casual' && mode !== 'competitive') {
                res.status(400).json({ error: "Mode must be either 'casual' or 'competitive'" });
            }
            else {

                // Generate a unique stream URL
                const streamUrl = generateStreamUrl();

                // Create the event
                const eventId = await createEvent({
                    mode,
                    challengeType,
                    difficulty,
                    hostUserId,
                    streamUrl
                });

                res.status(201).json({ id: eventId, streamUrl });
            }
        }
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
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
eventRouter.post("/:id/join", /*authenticateJWT,*/ async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userId = 1;//req.user.id;
        const { role } = req.body;

        if (!role || (role !== 'opponent' && role !== 'spectator')) {
            res.status(400).json({ error: "Role must be either 'opponent' or 'spectator'" });
        } else {

            // Check if event exists
            const event = await getEventById(eventId);
            if (!event) {
                res.status(404).json({ error: "Event not found" });
            }
            else {

                // Check if event is joinable
                if (event.status !== 'pending') {
                    res.status(400).json({ error: "Cannot join an event that is not pending" });
                } else {

                    // For opponent role, check if the spot is available
                    if (role === 'opponent' && event.opponentUserId) {
                        res.status(400).json({ error: "This event already has an opponent" });
                    } else {

                        // Join the event
                        await joinEvent(eventId, userId, role);

                        res.status(200).json({ message: `Successfully joined event as ${role}` });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error joining event:`, error);
        res.status(500).json({ error: "Failed to join event" });
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
eventRouter.get("/live", async (req, res) => {
    try {
        const liveEvents = await getLiveEvents();
        res.status(200).json(liveEvents);
    } catch (error) {
        console.error("Error fetching live events:", error);
        res.status(500).json({ error: "Failed to fetch live events" });
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
eventRouter.get("/:id", async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        const event = await getEventById(eventId);
        if (!event) {
            res.status(404).json({ error: "Event not found" });
        } else {

            res.status(200).json(event);
        }
    } catch (error) {
        console.error(`Error fetching event ${req.params.id}:`, error);
        res.status(500).json({ error: "Failed to fetch event details" });
    }
});