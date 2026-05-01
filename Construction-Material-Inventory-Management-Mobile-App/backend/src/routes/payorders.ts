import { Router } from 'express';
import {
    getPayorders, createPayorder, deletePayorder,
    getPayorderInventory, addPayorderItem, removePayorderItem,
    updatePayorderStatus, updateItemFulfillment,
} from '../controllers/payordersController';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getPayorders);
router.post('/', requirePermission(PERMISSIONS.PROJECT_MANAGER), createPayorder);
router.patch('/:id/status', updatePayorderStatus);
router.delete('/:id', requirePermission(PERMISSIONS.PROJECT_MANAGER), deletePayorder);

router.get('/:id/inventory', getPayorderInventory);
router.post('/:id/inventory', requirePermission(PERMISSIONS.PROJECT_MANAGER), addPayorderItem);
router.patch('/:id/inventory/:itemType/:itemRowId/fulfillment', updateItemFulfillment);
router.delete('/:id/inventory/:itemType/:itemRowId', requirePermission(PERMISSIONS.PROJECT_MANAGER), removePayorderItem);

export default router;