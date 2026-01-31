import auth from '../middlewares/authMiddleware.js';
import * as controller from '../controllers/commentController.js';

// Note: comments are mounted under events; we export full paths so native router can match
export default [
	{ method: 'GET', path: '/api/events/:eventId/comments', handlers: [controller.getComments] },
	{ method: 'POST', path: '/api/events/:eventId/comments', handlers: [auth, controller.createComment] }
];
