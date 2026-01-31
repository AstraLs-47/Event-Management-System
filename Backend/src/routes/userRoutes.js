import auth from '../middlewares/authMiddleware.js';
import { profile } from '../controllers/userController.js';

export default [
	{ method: 'GET', path: '/api/user/profile', handlers: [auth, profile] }
];
