import pool from '../config/db.js';
import { parseJsonBody, sendJson } from '../lib/nodeHelpers.js';

const createComment = async (req, res) => {
  try {
    const { eventId } = req.routeParams || {};
    if (!eventId || isNaN(+eventId)) return sendJson(res, 400, { message: 'Invalid Event ID' });

    const body = (req.body && Object.keys(req.body).length) ? req.body : await parseJsonBody(req);
    const { content } = body;
    const userId = req.user && req.user.id;

    if (!content || !content.trim()) return sendJson(res, 400, { message: 'Comment cannot be empty' });

    // verify event exists
    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [+eventId]);
    if (eventRes.rows.length === 0) return sendJson(res, 404, { message: 'Event not found' });

    // Insert comment
    const insertRes = await pool.query(
      'INSERT INTO comments (content, "userId", "eventId") VALUES ($1, $2, $3) RETURNING *',
      [content, userId, +eventId]
    );
    const rawComment = insertRes.rows[0];

    // Fetch user details to match the previous 'include' behavior
    const userRes = await pool.query('SELECT id, "fullName", username FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    const comment = { ...rawComment, user };

    // Broadcast through Socket.IO if available
    try {
      const io = req.io;
      if (io) io.to(`event_${eventId}`).emit('newComment', comment);
    } catch (e) {
      console.error('Socket emit failed', e.message);
    }

    return sendJson(res, 201, comment);
  } catch (err) {
    console.error('createComment error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { eventId } = req.routeParams || {};
    if (!eventId || isNaN(+eventId)) return sendJson(res, 400, { message: 'Invalid Event ID' });

    const query = `
      SELECT c.*, u.id as "u_id", u."fullName" as "u_fullName", u.username as "u_username"
      FROM comments c
      JOIN users u ON c."userId" = u.id
      WHERE c."eventId" = $1
      ORDER BY c."createdAt" ASC
    `;
    const result = await pool.query(query, [+eventId]);
    const comments = result.rows.map(row => ({
      id: row.id, content: row.content, userId: row.userId, eventId: row.eventId, createdAt: row.createdAt,
      user: { id: row.u_id, fullName: row.u_fullName, username: row.u_username }
    }));
    return sendJson(res, 200, comments);
  } catch (err) {
    console.error('getComments error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};

export { createComment, getComments };
