import express from 'express';
import { protectedRoute, adminOnly } from '../middlewares/authMiddleware.js';
import {
  getAllManagers,
  createManager,
  updateManager,
  deleteManager,
  getAvailableTheaters
} from '../controllers/managerController.js';

const router = express.Router();

// Tất cả routes đều cần admin
router.use(protectedRoute, adminOnly);

// Lấy danh sách theaters để assign
router.get('/theaters', getAvailableTheaters);

// CRUD managers
router.get('/', getAllManagers);
router.post('/', createManager);
router.put('/:id', updateManager);
router.delete('/:id', deleteManager);

export default router;
