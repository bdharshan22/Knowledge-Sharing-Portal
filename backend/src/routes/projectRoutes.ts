import express from 'express';
import { createProject, getProjects, getProjectById, likeProject, addComment } from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getProjects);
router.get('/:id', getProjectById);

router.post('/', protect, createProject);
router.put('/:id/like', protect, likeProject);
router.post('/:id/comments', protect, addComment);

export default router;
