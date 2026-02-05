import express from 'express';
import { getUserProfile, updateProfile, getUserBookmarks, updateLearningReminders, getCollections, getCollectionById, createCollection, updateCollection, deleteCollection, addPostToCollection, removePostFromCollection, toggleFollow, uploadAvatar, getUserActivity } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.get('/bookmarks', protect, getUserBookmarks);
router.put('/reminders', protect, updateLearningReminders);
router.get('/collections', protect, getCollections);
router.get('/collections/:collectionId', protect, getCollectionById);
router.post('/collections', protect, createCollection);
router.put('/collections/:collectionId', protect, updateCollection);
router.delete('/collections/:collectionId', protect, deleteCollection);
router.post('/collections/:collectionId/posts', protect, addPostToCollection);
router.delete('/collections/:collectionId/posts/:postId', protect, removePostFromCollection);
router.put('/:targetUserId/follow', protect, toggleFollow);
router.get('/:userId/activity', getUserActivity);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/:id', getUserProfile);
router.put('/profile', protect, updateProfile);

export default router;
