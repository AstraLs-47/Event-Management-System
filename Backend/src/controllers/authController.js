import pool from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { parseJsonBody, setCookie, clearCookie, sendJson } from '../lib/nodeHelpers.js';

function parseExpires(expiresIn) {
  if (!expiresIn) return 7 * 24 * 60 * 60 * 1000;
  const v = String(expiresIn).trim();
  if (v.endsWith('d')) return parseInt(v) * 24 * 60 * 60 * 1000;
  if (v.endsWith('h')) return parseInt(v) * 60 * 60 * 1000;
  if (v.endsWith('m')) return parseInt(v) * 60 * 1000;
  const n = parseInt(v);
  if (!isNaN(n)) return n * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

const register = async (req, res) => {
  const body = (req.body && Object.keys(req.body).length) ? req.body : await parseJsonBody(req);
  const { fullName, username, email, password } = body;

  if (!fullName || !username || !email || !password) {
    return sendJson(res, 400, { message: 'Missing required fields: fullName, username, email, password' });
  }

  // Check uniqueness of email and username
  const emailRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (emailRes.rows.length > 0) return sendJson(res, 400, { message: 'Email already in use' });

  const usernameRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (usernameRes.rows.length > 0) return sendJson(res, 400, { message: 'Username already in use' });

  const hashed = await hashPassword(password);

  const insertRes = await pool.query(
    'INSERT INTO users ("fullName", username, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
    [fullName, username, email, hashed]
  );
  const user = insertRes.rows[0];

  // Generate token and set as httpOnly cookie
  const token = generateToken({ id: user.id });
  const maxAge = parseExpires(process.env.JWT_EXPIRES_IN);
  setCookie(res, 'token', token, { httpOnly: true, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', maxAge, path: '/' });
  return sendJson(res, 201, {
    message: 'User Registered Successfully',
    token,
    user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName }
  });
};

const login = async (req, res) => {
  const body = (req.body && Object.keys(req.body).length) ? req.body : await parseJsonBody(req);
  // allow login by email or username
  const { identifier, password, email } = body;
  const lookup = identifier || email;
  if (!lookup || !password) return sendJson(res, 400, { message: 'Missing credentials' });

  // try email first, then username
  let result = await pool.query('SELECT * FROM users WHERE email = $1', [lookup]);
  if (result.rows.length === 0) {
    result = await pool.query('SELECT * FROM users WHERE username = $1', [lookup]);
  }
  const user = result.rows[0];

  if (!user || !(await comparePassword(password, user.password))) {
    return sendJson(res, 400, { message: 'Invalid credentials' });
  }

  // Set cookie and return token
  const token = generateToken({ id: user.id });
  const maxAge = parseExpires(process.env.JWT_EXPIRES_IN);
  setCookie(res, 'token', token, { httpOnly: true, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', maxAge, path: '/' });
  return sendJson(res, 200, { token, user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName } });
};

const logout = async (req, res) => {
  // Clear the token cookie
  clearCookie(res, 'token', { httpOnly: true, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return sendJson(res, 200, { message: 'Successfully Logged out' });
};

export { register, login, logout };
