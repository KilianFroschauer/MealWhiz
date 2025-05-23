import express, { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { generateStreamUrl, createEvent, addEventMessage, getEventById, getLiveEvents, joinEvent, getEventsByFilter } from './event-repository';

export const eventRouter: Router = express.Router();

// --- Route Handler for POST /events ---
const createEventHandler: RequestHandler = async (req, res, next) => {
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
};
eventRouter.post("/", createEventHandler);

// --- Route Handler for GET /events ---
const getFilteredEventsHandler: RequestHandler = async (req, res, next) => {
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
};
eventRouter.get("/", getFilteredEventsHandler);

// --- Route Handler for POST /events/:id/join ---
const joinEventHandler: RequestHandler = async (req, res, next) => {
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
};
eventRouter.post("/:id/join", joinEventHandler);

// --- Route Handler for GET /events/live ---
const getLiveEventsHandler: RequestHandler = async (req, res, next) => {
    try {
        const liveEvents = await getLiveEvents();
        res.status(200).json(liveEvents);
    } catch (error) {
        console.error("Error fetching live events:", error);
        next(error);
    }
};
eventRouter.get("/live", getLiveEventsHandler);

// --- Route Handler for GET /events/:id ---
const getEventByIdHandler: RequestHandler = async (req, res, next) => {
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
};
eventRouter.get("/:id", getEventByIdHandler);