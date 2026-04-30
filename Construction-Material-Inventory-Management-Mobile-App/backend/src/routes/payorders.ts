import { Router } from 'express';
import {
    getPayorders, createPayorder, deletePayorder,
    getPayorderInventory, addPayorderItem
} from '../controllers/payordersController';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getPayorders);
router.post('/', requirePermission(PERMISSIONS.PROJECT_MANAGER), createPayorder);
router.delete('/:id', requirePermission(PERMISSIONS.PROJECT_MANAGER), deletePayorder);

router.get('/:id/inventory', getPayorderInventory);
router.post('/:id/inventory', requirePermission(PERMISSIONS.PROJECT_MANAGER), addPayorderItem);