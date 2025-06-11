import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
    generateStreamUrl,
    createEvent as createEventInRepo, // Renamed to avoid conflict
    getEventById as getEventByIdFromRepo, // Renamed
    getLiveEvents as getLiveEventsFromRepo, // Renamed
    joinEvent as joinEventInRepo, // Renamed
    getEventsByFilter as getEventsByFilterFromRepo // Renamed
} from '../repository/event.repository'; // Adjust path if necessary
import { EventCreationData } from '../models/event.models'; // Assuming you have or will create this type

// You might want to define specific types for request bodies if not already done
interface CreateEventRequestBody {
    mode: 'casual' | 'competitive';
    challengeType: string;
    difficulty: string;
}

interface JoinEventRequestBody {
    role: 'opponent' | 'spectator';
}

export class EventController {
    /**
     * Creates a new cooking event (casual or competitive).
     * @param {Request} req - Express request object. Body should contain mode, challengeType, difficulty.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async createNewEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { mode, challengeType, difficulty } = req.body as CreateEventRequestBody;
            const hostUserId = (req as any).payload?.user?.userId;

            if (!mode || !challengeType || !difficulty) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing required fields: mode, challengeType, difficulty" });
                return;
            }
            if (mode !== 'casual' && mode !== 'competitive') {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Mode must be either 'casual' or 'competitive'" });
                return;
            }

            const streamUrl = generateStreamUrl();
            const eventData: EventCreationData = {
                mode,
                challengeType,
                difficulty,
                hostUserId,
                streamUrl
            };

            const eventId = await createEventInRepo(eventData);
            res.status(StatusCodes.CREATED).json({ id: eventId, streamUrl });
        } catch (error) {
            console.error("Error creating event:", error);
            next(error);
        }
    }

    /**
     * Retrieves a list of cooking events based on specified mode and status filters.
     * @param {Request} req - Express request object. Query params: mode, status.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async getFilteredEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const modeQuery = req.query.mode as string | undefined;
            const statusQuery = req.query.status as string | undefined;
            let internalStatus: 'pending' | 'live' | 'ended';

            if (!modeQuery || (modeQuery !== 'casual' && modeQuery !== 'competitive')) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid or missing 'mode' query parameter. Must be 'casual' or 'competitive'." });
                return;
            }

            if (statusQuery === 'open') {
                internalStatus = 'pending';
            } else if (statusQuery === 'pending' || statusQuery === 'live' || statusQuery === 'ended') {
                internalStatus = statusQuery as 'pending' | 'live' | 'ended';
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid or missing 'status' query parameter. Accepted values are 'open', 'pending', 'live', or 'ended'." });
                return;
            }

            const events = await getEventsByFilterFromRepo(modeQuery as 'casual' | 'competitive', internalStatus);
            res.status(StatusCodes.OK).json(events);
        } catch (error) {
            console.error("Error fetching events by filter:", error);
            next(error);
        }
    }

    /**
     * Allows a user to join an event as an opponent or spectator.
     * @param {Request} req - Express request object. Params: id. Body: role.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async joinExistingEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const eventId = parseInt(req.params.id);
            if (isNaN(eventId)) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid event ID." });
                return;
            }

            const userId = (req as any).payload?.user?.userId;
            const { role } = req.body as JoinEventRequestBody;

            if (!role || (role !== 'opponent' && role !== 'spectator')) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Role must be either 'opponent' or 'spectator'" });
                return;
            }

            const event = await getEventByIdFromRepo(eventId);
            if (!event) {
                res.status(StatusCodes.NOT_FOUND).json({ error: "Event not found" });
                return;
            }
            if (event.status !== 'pending') {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Cannot join an event that is not pending" });
                return;
            }
            if (role === 'opponent' && event.opponentUserId) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "This event already has an opponent" });
                return;
            }

            await joinEventInRepo(eventId, userId, role);
            res.status(StatusCodes.OK).json({ message: `Successfully joined event as ${role}` });
        } catch (error) {
            console.error(`Error joining event ${req.params.id}:`, error);
            next(error);
        }
    }

    /**
     * Returns a list of currently live cooking events.
     * @param {Request} req - Express request object.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async getAllLiveEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const liveEvents = await getLiveEventsFromRepo();
            res.status(StatusCodes.OK).json(liveEvents);
        } catch (error) {
            console.error("Error fetching live events:", error);
            next(error);
        }
    }

    /**
     * Retrieves details for a specific event by its ID.
     * @param {Request} req - Express request object. Params: id.
     * @param {Response} res - Express response object.
     * @param {NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async getEventDetailsById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const eventId = parseInt(req.params.id);
            if (isNaN(eventId)) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid event ID." });
                return;
            }
            const event = await getEventByIdFromRepo(eventId);
            if (!event) {
                res.status(StatusCodes.NOT_FOUND).json({ error: "Event not found" });
                return;
            }
            res.status(StatusCodes.OK).json(event);
        } catch (error) {
            console.error(`Error fetching event ${req.params.id}:`, error);
            next(error);
        }
    }
}