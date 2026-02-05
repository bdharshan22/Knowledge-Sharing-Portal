import express from 'express';
import { createPost, getPosts, getPostById, deletePost, updatePost, likePost, toggleBookmark, reportPost, generateSummary, addComment, deleteComment, addAnswer, acceptAnswer, voteAnswer, getFeed } from '../controllers/postController';
import { protect, optionalAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/feed', protect, getFeed);
router.route('/').get(optionalAuth, getPosts).post(protect, createPost);
router.route('/:id').get(getPostById).put(protect, updatePost).delete(protect, deletePost);

router.route('/:id/like').put(protect, likePost);
router.route('/:id/bookmark').put(protect, toggleBookmark);
router.route('/:id/report').post(protect, reportPost);
router.route('/:id/summary').post(protect, generateSummary);
router.route('/:id/comment').post(protect, addComment);
router.route('/:id/comment/:commentId').delete(protect, deleteComment);

router.route('/:id/answers').post(protect, addAnswer);
router.route('/:id/answers/:answerId/accept').put(protect, acceptAnswer);
router.route('/:id/answers/:answerId/vote').put(protect, voteAnswer);

export default router;
