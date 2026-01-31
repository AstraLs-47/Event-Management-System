import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { parseCookiesHeader, sendJson } from '../lib/nodeHelpers.js';

export default async (req, res, next) => {
  try {
    let token = undefined;
    const authHdr = req.headers.authorization;
    if (authHdr && authHdr.split(' ')[1]) token = authHdr.split(' ')[1];
    if (!token) {
      const cookies = parseCookiesHeader(req);
      if (cookies && cookies.token) token = cookies.token;
    }

    if (!token) return sendJson(res, 401, { message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      req.user = result.rows[0];
      return next();
    } catch (err) {
      console.error('authMiddleware error', err.message);
      return sendJson(res, 401, { message: 'Invalid token' });
    }
  } catch (err) {
    console.error('authMiddleware unexpected error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};
