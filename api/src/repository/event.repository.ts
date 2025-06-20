import { pool } from "../config";
import { v4 as uuidv4 } from 'uuid';

interface EventInput {
  mode: 'casual' | 'competitive';
  challengeType: string;
  difficulty: string;
  hostUserId: number;
  streamUrl: string;
}

interface EventParticipant {
  userId: number;
  username: string;
  role: 'host' | 'opponent' | 'spectator';
  joinedAt: Date;
}

interface Event {
  id: number;
  mode: string;
  status: 'pending' | 'live' | 'ended';
  hostUserId: number;
  hostName: string;
  opponentUserId?: number;
  opponentName?: string;
  challengeType: string;
  difficulty: string;
  startTime?: Date;
  endTime?: Date;
  streamUrl: string;
  createdAt: Date;
  participants: EventParticipant[];
}

/**
 * Generates a unique streaming URL for an event
 */
export function generateStreamUrl(): string {
  // Generate a unique room name using UUID
  const roomName = `mealwhiz-${uuidv4()}`;
  
  // Use the new self-hosted Jitsi server URL
  return `https://meet.localhost/${roomName}#config.prejoinPageEnabled=false&config.requireDisplayName=false&config.enableLobbyChat=false`;
  
  // For other platforms, use their API or URL structure
}

/**
 * Creates a new event
 */
export async function createEvent(eventData: EventInput): Promise<number> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert the event
    const eventResult = await client.query(
      `INSERT INTO events 
       (mode, status, host_user_id, challenge_type, difficulty, stream_url)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING id`,
      [eventData.mode, eventData.hostUserId, eventData.challengeType, 
       eventData.difficulty, eventData.streamUrl]
    );
    
    const eventId = eventResult.rows[0].id;
    
    // Add the host role in event_roles
    await client.query(
      `INSERT INTO event_roles (event_id, user_id, role)
       VALUES ($1, $2, 'host')`,
      [eventId, eventData.hostUserId]
    );
    
    await client.query('COMMIT');
    return eventId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating event:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gets an event by ID with all participant details
 */
export async function getEventById(eventId: number): Promise<Event | null> {
  const client = await pool.connect();
  
  try {
    // Get basic event info
    const eventResult = await client.query(
      `SELECT e.*, 
              h.user_name as host_name,
              o.user_name as opponent_name
       FROM events e
       JOIN "user" h ON e.host_user_id = h.user_id
       LEFT JOIN "user" o ON e.opponent_user_id = o.user_id
       WHERE e.id = $1`,
      [eventId]
    );
    
    if (eventResult.rows.length === 0) {
      return null;
    }
    
    const event = eventResult.rows[0];
    
    // Get participants
    const participantsResult = await client.query(
      `SELECT er.user_id, u.user_name, er.role, er.joined_at
       FROM event_roles er
       JOIN "user" u ON er.user_id = u.user_id
       WHERE er.event_id = $1`,
      [eventId]
    );
    
    const participants = participantsResult.rows.map(row => ({
      userId: row.user_id,
      username: row.user_name,
      role: row.role,
      joinedAt: row.joined_at
    }));
    
    return {
      id: event.id,
      mode: event.mode,
      status: event.status,
      hostUserId: event.host_user_id,
      hostName: event.host_name,
      opponentUserId: event.opponent_user_id,
      opponentName: event.opponent_name,
      challengeType: event.challenge_type,
      difficulty: event.difficulty,
      startTime: event.start_time,
      endTime: event.end_time,
      streamUrl: event.stream_url,
      createdAt: event.created_at,
      participants
    };
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all live events
 */
export async function getLiveEvents(): Promise<any[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT e.id, e.mode, e.challenge_type, e.difficulty, 
              e.start_time, e.stream_url,
              h.user_name as host_name,
              o.user_name as opponent_name,
              (SELECT COUNT(*) FROM event_roles WHERE event_id = e.id AND role = 'spectator') as spectator_count
       FROM events e
       JOIN "user" h ON e.host_user_id = h.user_id
       LEFT JOIN "user" o ON e.opponent_user_id = o.user_id
       WHERE e.status = 'live'
       ORDER BY e.start_time DESC`
    );
    
    return result.rows.map(row => ({
      id: row.id,
      mode: row.mode,
      hostName: row.host_name,
      opponentName: row.opponent_name,
      challengeType: row.challenge_type,
      difficulty: row.difficulty,
      startTime: row.start_time,
      streamUrl: row.stream_url,
      spectatorCount: parseInt(row.spectator_count)
    }));
  } catch (error) {
    console.error('Error fetching live events:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gets events by mode and status
 */
export async function getEventsByFilter(mode: string, status: string): Promise<Event[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT e.id, e.mode, e.status, e.challenge_type, e.difficulty,
              e.start_time, e.stream_url, e.created_at,
              h.user_name as host_name,
              o.user_name as opponent_name,
              e.host_user_id, e.opponent_user_id
       FROM events e
       JOIN "user" h ON e.host_user_id = h.user_id
       LEFT JOIN "user" o ON e.opponent_user_id = o.user_id
       WHERE e.mode = $1 AND e.status = $2
       ORDER BY e.created_at DESC`,
      [mode, status]
    );

    // Get participants for each event (similar to getEventById)
    const eventsWithParticipants = await Promise.all(result.rows.map(async (eventRow) => {
      const participantsResult = await client.query(
        `SELECT er.user_id, u.user_name, er.role, er.joined_at
         FROM event_roles er
         JOIN "user" u ON er.user_id = u.user_id
         WHERE er.event_id = $1`,
        [eventRow.id]
      );
      const participants = participantsResult.rows.map(p => ({
        userId: p.user_id,
        username: p.user_name,
        role: p.role,
        joinedAt: p.joined_at
      }));
      return {
        id: eventRow.id,
        mode: eventRow.mode,
        status: eventRow.status,
        hostUserId: eventRow.host_user_id,
        hostName: eventRow.host_name,
        opponentUserId: eventRow.opponent_user_id,
        opponentName: eventRow.opponent_name,
        challengeType: eventRow.challenge_type,
        difficulty: eventRow.difficulty,
        startTime: eventRow.start_time,
        endTime: eventRow.end_time,
        streamUrl: eventRow.stream_url,
        createdAt: eventRow.created_at,
        participants
      };
    }));
    return eventsWithParticipants;
  } catch (error) {
    console.error('Error fetching events by filter:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Join an event as opponent or spectator
 */
export async function joinEvent(eventId: number, userId: number, role: 'opponent' | 'spectator'): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add the user role in event_roles
    await client.query(
      `INSERT INTO event_roles (event_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET role = $3`,
      [eventId, userId, role]
    );
    
    // If joining as opponent, update the opponent_user_id in events table
    if (role === 'opponent') {
      await client.query(
        `UPDATE events SET opponent_user_id = $1 WHERE id = $2`,
        [userId, eventId]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error joining event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add a chat message to an event
 * Note: This assumes you have or will create an event_messages table
 */
export async function addEventMessage(eventId: number, userId: number, message: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Here we assume you would have an event_messages table
    // If not, you'll need to create it first
    await client.query(
      `INSERT INTO event_messages (event_id, user_id, message)
       VALUES ($1, $2, $3)`,
      [eventId, userId, message]
    );
  } catch (error) {
    console.error(`Error adding message to event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}