import express from 'express';
import managerTheaterController from '../controllers/managerTheaterController.js';
import { protectedRoute, adminOnly, adminOrManager } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes cho manager
router.get('/my-theaters', protectedRoute, adminOrManager, managerTheaterController.getMyTheaters);
router.get('/check/:theaterId', protectedRoute, adminOrManager, managerTheaterController.checkAccess);

// Routes cho admin
router.get('/managers', protectedRoute, adminOnly, managerTheaterController.getAllManagers);
router.get('/assignments', protectedRoute, adminOnly, managerTheaterController.getAllAssignments);
router.get('/theater/:theaterId/managers', protectedRoute, adminOnly, managerTheaterController.getManagersByTheater);
router.post('/assign', protectedRoute, adminOnly, managerTheaterController.assignManager);
router.delete('/remove', protectedRoute, adminOnly, managerTheaterController.removeManager);

export default router;
