import { login, register, logout } from '../controllers/authController.js';

// Export plain route configs for native router. Paths are absolute so server can register directly.
export default [
	{ method: 'POST', path: '/api/auth/login', handlers: [login] },
	{ method: 'POST', path: '/api/auth/register', handlers: [register] },
	{ method: 'POST', path: '/api/auth/logout', handlers: [logout] }
];
