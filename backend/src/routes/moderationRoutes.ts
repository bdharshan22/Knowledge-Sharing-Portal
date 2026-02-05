import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getFlaggedPosts, resolvePost } from '../controllers/moderationController';

const router = express.Router();

router.get('/posts', protect, getFlaggedPosts);
router.put('/posts/:id', protect, resolvePost);

export default router;
