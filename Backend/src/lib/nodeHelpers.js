export async function parseJsonBody(req) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('application/json')) {
    return new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => { raw += chunk; });
      req.on('end', () => {
        if (!raw) return resolve({});
        try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('Invalid JSON')); }
      });
      req.on('error', reject);
    });
  }
  // do not attempt to parse multipart/form-data (let multer handle it) or other types
  return {};
}

export function parseCookiesHeader(req) {
  const hdr = req.headers.cookie || '';
  const cookies = {};
  hdr.split(';').map(c => c.trim()).filter(Boolean).forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    cookies[k] = decodeURIComponent(v);
  });
  return cookies;
}

export function sendJson(res, status, obj) {
  const str = JSON.stringify(obj);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(str));
  res.writeHead(status);
  res.end(str);
}

function buildSetCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push('Secure');
  if (opts.expires) parts.push(`Expires=${new Date(opts.expires).toUTCString()}`);
  return parts.join('; ');
}

export function setCookie(res, name, value, opts = {}) {
  const header = buildSetCookie(name, value, opts);
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', header);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', [...prev, header]);
  else res.setHeader('Set-Cookie', [prev, header]);
}

export function clearCookie(res, name, opts = {}) {
  const o = { ...opts, expires: new Date(0), maxAge: 0 };
  setCookie(res, name, '', o);
}
