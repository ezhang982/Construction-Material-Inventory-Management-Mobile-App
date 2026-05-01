import { Router } from 'express';
import { login, me, register, deleteUser, updatePermission, listUsers } from '../controllers/authController';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth';

const router = Router();

router.post('/login', login);

// /me requires a valid token but is open to ANY logged-in user (not just admin),
// so it has to be declared before the admin gate below.
router.get('/me', requireAuth, me);

// all routes below require login + admin permission
router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.ADMIN));

router.post('/register', register);
router.get('/users', listUsers);
router.delete('/users/:email', deleteUser);
router.patch('/users/:email/permission', updatePermission);

export default router;