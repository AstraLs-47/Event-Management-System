import pool from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { parseJsonBody, sendJson } from '../lib/nodeHelpers.js';

function parseFlexibleDate(input) {
  if (!input) return null;
  const s = String(input).trim();

  // try direct parse
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();

  // try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    d = new Date(`${s}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // try to handle ranges like "January 24 and 25, 2026" or "Jan 24 - Jan 25 2026"
  const yearMatch = s.match(/\b(20\d{2}|19\d{2})\b/);
  const year = yearMatch ? yearMatch[0] : null;
  // split on common separators (use word boundaries for 'and' and 'to')
  const parts = s.split(/\band\b|&|\s-\s|\s+to\s+|\//i).map(p => p.trim()).filter(Boolean);
  for (const part of parts) {
    let candidate = part;
    // if part doesn't contain a year, append extracted year if available
    if (year && !/\b(20\d{2}|19\d{2})\b/.test(candidate)) {
      candidate = `${candidate} ${year}`;
    }
    d = new Date(candidate);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  //month+day pattern and attach year
  const monthDay = s.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b\s*(\d{1,2})(?:,?\s*(\d{4}))?/i);
  if (monthDay) {
    const mo = monthDay[1];
    const day = monthDay[2];
    const yr = monthDay[3] || year;
    if (yr) {
      d = new Date(`${mo} ${day} ${yr}`);
      if (!isNaN(d.getTime())) return d.toISOString();
    } else {
      d = new Date(`${mo} ${day}`);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  return null;
}

const createEvent = async (req, res) => {
  try {
    // support multipart file uploads or base64 in JSON
    let imageUrl = null;
    // ensure we have parsed JSON body if present
    const body = (req.body && Object.keys(req.body).length) ? req.body : await parseJsonBody(req);

    // mulitple patterns req.uploadedFile (single) or req.uploadedFiles (any)
    const uploaded = req.uploadedFile ?? (req.uploadedFiles && req.uploadedFiles[0]);
    const protocol = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
    const host = req.headers.host;

    if (uploaded && uploaded.filename) {
      imageUrl = `${protocol}://${host}/uploads/${uploaded.filename}`;
    } else {
      const imageData = (body && (body.imageBase64 || body.image)) || undefined;
      if (imageData && imageData.startsWith('data:')) {
        const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const ext = mime.split('/')[1];
          const filename = `event-${Date.now()}.${ext}`;
          const buffer = Buffer.from(match[2], 'base64');
          const uploadPath = path.join(process.cwd(), 'uploads', filename);
          await fs.writeFile(uploadPath, buffer);
          imageUrl = `${protocol}://${host}/uploads/${filename}`;
        }
      }
    }

    const { image, imageBase64, userId, ...rest } = body;

    // Whitelist allowed event fields
    const allowed = ['title', 'location', 'date', 'email', 'phone', 'type', 'description', 'time'];
    const dataFields = {};
    for (const k of allowed) {
      if (rest[k] !== undefined) dataFields[k] = rest[k];
    }

    // Build data object and coerce date to ISO-8601 DateTime
    console.log('createEvent incoming rest:', rest);
    const dataObj = { ...dataFields, image: imageUrl, userId: req.user.id };
    if (rest.date) {
      // convert data to iso 8601 - databas3 friendly
      const iso = parseFlexibleDate(rest.date);
      if (!iso) {
        return sendJson(res, 400, {
          message: 'Invalid date format. Please send a single date (ISO-8601) or a parsable date string.',
          example: '2026-06-10T00:00:00.000Z'
        });
      }
      dataObj.date = iso;
    }

    console.log('createEvent dataObj:', dataObj);
    
    const keys = Object.keys(dataObj);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO events (${cols}) VALUES (${vals}) RETURNING *`;
    const result = await pool.query(query, Object.values(dataObj));
    const event = result.rows[0];
    return sendJson(res, 200, event);
  } catch (err) {
    console.error('createEvent error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};

const getEvents = async (req, res) => {
  try {
    const { type, userId } = req.searchParameters || {};
    
    let query = `
      SELECT e.*, 
             u.id as "u_id", u."fullName" as "u_fullName", u.username as "u_username", u.email as "u_email", u."createdAt" as "u_createdAt"
      FROM events e
      LEFT JOIN users u ON e."userId" = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND e.type = $${params.length}`;
    }

    if (userId && !isNaN(+userId)) {
      params.push(+userId);
      query += ` AND e."userId" = $${params.length}`;
    }

    query += ` ORDER BY e.date DESC`;
    const result = await pool.query(query, params);
    const events = result.rows.map(row => {
      const { u_id, u_fullName, u_username, u_email, u_createdAt, ...eventData } = row;
      return { ...eventData, user: u_id ? { id: u_id, fullName: u_fullName, username: u_username, email: u_email, createdAt: u_createdAt } : null };
    });
    return sendJson(res, 200, events);
  } catch (err) {
    console.error('getEvents error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.routeParams;
    const findRes = await pool.query('SELECT * FROM events WHERE id = $1', [+id]);
    const event = findRes.rows[0];

    if (!event) return sendJson(res, 404, { message: 'Not found' });
    if (!req.user || event.userId !== req.user.id) {
      return sendJson(res, 403, { message: 'Forbidden' });
    }

    // handle possible image update (file or base64)
    let imageUrl = event.image;
    const body = (req.body && Object.keys(req.body).length) ? req.body : await parseJsonBody(req);
    const uploaded = req.uploadedFile ?? (req.uploadedFiles && req.uploadedFiles[0]);
    const protocol = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
    const host = req.headers.host;

    if (uploaded && uploaded.filename) {
      imageUrl = `${protocol}://${host}/uploads/${uploaded.filename}`;
    } else {
      const imageData = (body && (body.imageBase64 || body.image)) || undefined;
      if (imageData && imageData.startsWith('data:')) {
        const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const ext = mime.split('/')[1];
          const filename = `event-${Date.now()}.${ext}`;
          const buffer = Buffer.from(match[2], 'base64');
          const uploadPath = path.join(process.cwd(), 'uploads', filename);
          await fs.writeFile(uploadPath, buffer);
          imageUrl = `${protocol}://${host}/uploads/${filename}`;
        }
      }
    }

    const { image, imageBase64, userId, ...rest } = body;

    // Whitelist fields for update as well
    const allowed = ['title', 'location', 'date', 'email', 'phone', 'type', 'description', 'time'];
    const dataFields = {};
    for (const k of allowed) {
      if (rest[k] !== undefined) dataFields[k] = rest[k];
    }

    const dataObj = { ...dataFields, image: imageUrl };
    console.log('updateEvent incoming rest:', rest);
    if (rest.date) {
      const iso = parseFlexibleDate(rest.date);
      if (!iso) {
        return sendJson(res, 400, {
          message: 'Invalid date format. Please send a single date (ISO-8601) or a parsable date string.',
          example: '2026-06-10T00:00:00.000Z'
        });
      }
      dataObj.date = iso;
    }

      console.log('updateEvent dataObj:', dataObj);
      const keys = Object.keys(dataObj);
      const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
      const query = `UPDATE events SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
      const updateRes = await pool.query(query, [...Object.values(dataObj), +id]);
      const updated = updateRes.rows[0];
      return sendJson(res, 200, updated);
  } catch (err) {
    console.error('updateEvent error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.routeParams;
  await pool.query('DELETE FROM events WHERE id = $1', [+id]);
  return sendJson(res, 200, { message: 'Deleted successfully' });
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.routeParams;
    if (!id || isNaN(+id)) return sendJson(res, 400, { message: 'Invalid event ID' });

    const query = `
      SELECT e.*, 
             u.id as "u_id", u."fullName" as "u_fullName", u.username as "u_username", u.email as "u_email", u."createdAt" as "u_createdAt"
      FROM events e
      LEFT JOIN users u ON e."userId" = u.id
      WHERE e.id = $1
    `;
    const result = await pool.query(query, [+id]);
    const row = result.rows[0];
    const { u_id, u_fullName, u_username, u_email, u_createdAt, ...eventData } = row || {};
    const event = row ? { ...eventData, user: u_id ? { id: u_id, fullName: u_fullName, username: u_username, email: u_email, createdAt: u_createdAt } : null } : null;

    if (!event) return sendJson(res, 404, { message: 'Event not found' });

    return sendJson(res, 200, event);
  } catch (err) {
    console.error('getEventById error', err);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
};


export{createEvent, getEvents, updateEvent, deleteEvent, getEventById}