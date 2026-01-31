import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { Server as IOServer } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { createNativeRouter } from './lib/nativeRouter.js';
import { parseJsonBody } from './lib/nodeHelpers.js';

const allRoutes = [
	...authRoutes,
	...eventRoutes,
	...userRoutes,
	...commentRoutes
];

const port = process.env.PORT || 3000;

// create server and Socket.IO then provide io via appContext to router
const server = http.createServer((req, res) => {
	// attach a small helper to allow controllers to access parsed body if desired
	req.parseJson = () => parseJsonBody(req);

	// Native CORS handling
	const origin = req.headers.origin;
	if (origin) {
		res.setHeader('Access-Control-Allow-Origin', origin);
		res.setHeader('Access-Control-Allow-Credentials', 'true');
	} else {
		res.setHeader('Access-Control-Allow-Origin', '*');
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Handle OPTIONS explicitly to ensure preflight checks pass
	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		return res.end();
	}

	// Serve static files from /uploads
	const url = new URL(req.url, `http://${req.headers.host}`);
	if (url.pathname.startsWith('/uploads/')) {
		const filePath = path.join(process.cwd(), url.pathname);
		const uploadsDir = path.join(process.cwd(), 'uploads');

		// Security check to prevent directory traversal
		if (filePath.startsWith(uploadsDir)) {
			fs.stat(filePath, (err, stats) => {
				if (err || !stats.isFile()) {
					res.writeHead(404);
					return res.end('Not Found');
				}
				const ext = path.extname(filePath).toLowerCase();
				const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
				const contentType = mimeTypes[ext] || 'application/octet-stream';
				res.writeHead(200, { 'Content-Type': contentType });
				fs.createReadStream(filePath).pipe(res);
			});
			return;
		}
	}

	nativeHandler(req, res, { io });
});
// create io server
const io = new IOServer(server, { cors: { origin: true, credentials: true } });

// create native router handler bound to appContext later
const nativeHandler = createNativeRouter(allRoutes);

io.on('connection', (socket) => {
	socket.on('joinEvent', (eventId) => { socket.join(`event_${eventId}`); });
	socket.on('leaveEvent', (eventId) => { socket.leave(`event_${eventId}`); });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
