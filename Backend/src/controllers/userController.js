import pool from '../config/db.js';
import { sendJson } from '../lib/nodeHelpers.js';

const profile = async (req, res) => {
  try {
    if (!req.user) return sendJson(res, 401, { message: 'Unauthorized' });

    const userId = +req.user.id;

    // Fetch user
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (!user) return sendJson(res, 404, { message: 'User not found' });

    // Fetch events for this user
    const eventsRes = await pool.query('SELECT * FROM events WHERE "userId" = $1 ORDER BY date DESC', [userId]);
    const events = eventsRes.rows;

    const { password, ...rest } = user;
    rest.events = events;

    return sendJson(res, 200, rest);
  } catch (err) {
    console.error('profile error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};

export { profile };
