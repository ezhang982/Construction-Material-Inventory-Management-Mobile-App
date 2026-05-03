import { Router } from 'express';
import {
    getWarehouses, createWarehouse, deleteWarehouse,
    getDeliveries, createDelivery, deleteDelivery,
    getDeliveryInventory, addDeliveryItem, removeDeliveryItem,
} from '../controllers/warehousesController';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getWarehouses);
router.post('/', requirePermission(PERMISSIONS.PROJECT_MANAGER), createWarehouse);
router.delete('/:id', requirePermission(PERMISSIONS.PROJECT_MANAGER), deleteWarehouse);

router.get('/:id/deliveries', getDeliveries);
router.post('/:id/deliveries', requirePermission(PERMISSIONS.LOGISTICS), createDelivery);
router.delete('/:warehouseId/deliveries/:deliveryId', requirePermission(PERMISSIONS.PROJECT_MANAGER), deleteDelivery);

router.get('/:warehouseId/deliveries/:deliveryId/inventory', getDeliveryInventory);
router.post('/:warehouseId/deliveries/:deliveryId/inventory', requirePermission(PERMISSIONS.LOGISTICS), addDeliveryItem);
router.delete('/:warehouseId/deliveries/:deliveryId/inventory/:itemType/:itemRowId', requirePermission(PERMISSIONS.PROJECT_MANAGER), removeDeliveryItem);

export default router;