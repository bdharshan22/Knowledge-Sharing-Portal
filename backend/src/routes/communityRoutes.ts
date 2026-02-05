import express from 'express';
import {
    getRooms, getRoomMessages, postMessage, createRoom, togglePinMessage, setSpotlight, clearSpotlight,
    getPolls, createPoll, votePoll
} from '../controllers/communityController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Rooms
router.get('/rooms', getRooms);
router.get('/rooms/:id', protect, getRoomMessages);
router.post('/rooms', protect, createRoom); // Admin or privileged users usually, but open for now
router.post('/rooms/:id/messages', protect, postMessage);
router.put('/rooms/:id/pin/:messageId', protect, togglePinMessage);
router.post('/rooms/:id/spotlight', protect, setSpotlight);
router.delete('/rooms/:id/spotlight', protect, clearSpotlight);

// Polls
router.get('/polls', getPolls);
router.post('/polls', protect, createPoll);
router.post('/polls/:id/vote', protect, votePoll);

export default router;
