import express from 'express';
import { createEvent, getEvents, registerEvent, cancelRegistration } from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getEvents);

router.post('/', protect, createEvent);
router.post('/:id/register', protect, registerEvent);
router.delete('/:id/register', protect, cancelRegistration);

export default router;
