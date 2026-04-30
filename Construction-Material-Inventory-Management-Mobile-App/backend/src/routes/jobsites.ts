import { Router } from 'express';
import {
    getJobsites, createJobsite, deleteJobsite,
    getJobsiteInventory, addInventoryItem, removeInventoryItem
} from '../controllers/jobsitesController';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth';

const router = Router();

// All jobsite routes require login
router.use(requireAuth);

router.get('/', getJobsites);
router.post('/', requirePermission(PERMISSIONS.PROJECT_MANAGER), createJobsite);
router.delete('/:id', requirePermission(PERMISSIONS.PROJECT_MANAGER), deleteJobsite);

router.get('/:id/inventory', getJobsiteInventory);
router.post('/:id/inventory', requirePermission(PERMISSIONS.PROJECT_MANAGER), addInventoryItem);
router.delete('/:id/inventory/:itemType/:itemRowId', requirePermission(PERMISSIONS.PROJECT_MANAGER), removeInventoryItem);