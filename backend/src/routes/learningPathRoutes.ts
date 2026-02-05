import express from 'express';
import { createPath, getPaths, getPathDetails, enrollPath, updateProgress } from '../controllers/learningPathController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getPaths);
router.get('/:id', getPathDetails);

// Protect writes
router.post('/', protect, createPath);
router.post('/:id/enroll', protect, enrollPath);
router.put('/:id/progress', protect, updateProgress);

export default router;
