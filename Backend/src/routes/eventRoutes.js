import auth from '../middlewares/authMiddleware.js';
import upload from '../middlewares/imageMiddleware.js';
import * as controller from '../controllers/eventController.js';

export default [
	{ method: 'GET', path: '/api/events', handlers: [controller.getEvents] },
	{ method: 'GET', path: '/api/events/:id', handlers: [controller.getEventById] },
	{ method: 'POST', path: '/api/events', handlers: [auth, upload.any(), controller.createEvent] },
	{ method: 'PUT', path: '/api/events/:id', handlers: [auth, upload.any(), controller.updateEvent] },
	{ method: 'DELETE', path: '/api/events/:id', handlers: [auth, controller.deleteEvent] }
];
