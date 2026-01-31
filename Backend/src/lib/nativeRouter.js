import { StringDecoder } from 'string_decoder';

function pathToRegex(path) {
  const keys = [];
  const pattern = path.replace(/:([^/]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${pattern}/?$`);
  return { regex, keys };
}

export function matchPath(pattern, pathname) {
  const { regex, keys } = pathToRegex(pattern);
  const m = pathname.match(regex);
  if (!m) return null;
  const params = {};
  keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
  return params;
}

export function createNativeRouter(routeList, options = {}) {
  // routeList: array of { method, path, handlers: [fn...] }
  const routes = (routeList || []).map(r => ({ method: (r.method||'GET').toUpperCase(), path: r.path, handlers: r.handlers || [r.handler] }));

  return function nativeHandler(req, res, appContext = {}) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      req.searchParameters = Object.fromEntries(url.searchParams.entries());
      req.pathname = url.pathname;
      req.get = (h) => req.headers[h.toLowerCase()];
      req.protocol = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
      // expose appContext properties directly on req (e.g. req.io)
      Object.assign(req, appContext);

      // find matching route
      const method = req.method.toUpperCase();
      let matched = null;
      for (const r of routes) {
        if (r.method !== method) continue;
        const params = matchPath(r.path, url.pathname);
        if (params) { matched = { route: r, params }; break; }
      }

      if (!matched) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Not found' }));
      }

      req.routeParams = matched.params || {};

      // execute handlers sequentially (middleware style)
      let idx = 0;
      const handlers = matched.route.handlers || [];
      const next = (err) => {
        if (err) {
          console.error('Handler error', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Internal server error' }));
        }
        const fn = handlers[idx++];
        if (!fn) {
          // no more handlers
          return;
        }
        try {
          const maybe = fn(req, res, next);
          if (maybe && typeof maybe.then === 'function') maybe.catch(next);
        } catch (e) { next(e); }
      };

      next();
    } catch (err) {
      console.error('nativeHandler error', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal server error' }));
    }
  };
}
