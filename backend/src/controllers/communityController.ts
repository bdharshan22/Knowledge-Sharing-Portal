import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { Poll } from '../models/Poll';
import { User } from '../models/User';

const requireModerator = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await User.findById(userId).select('role');
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return null;
    }
    if (user.role !== 'admin' && user.role !== 'moderator') {
        res.status(403).json({ message: 'Not authorized' });
        return null;
    }
    return user;
};

// --- Chat Rooms ---

export const getRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await Room.find({ isArchived: false }).select('-messages'); // Don't load full history in list
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getRoomMessages = async (req: Request, res: Response) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('messages.user', 'name avatar');

        if (!room) return res.status(404).json({ message: 'Room not found' });

        const now = Date.now();
        if (room.spotlight?.expiresAt && room.spotlight.expiresAt.getTime() < now) {
            room.spotlight = undefined as any;
            await room.save();
        }

        // Return last 50 messages
        const messages = room.messages.slice(-50);
        const pinnedMessages = room.pinnedMessages?.length
            ? room.messages.filter((msg: any) => room.pinnedMessages.some((id: any) => id.toString() === msg._id.toString()))
            : [];

        const spotlightMessage = room.spotlight?.messageId
            ? room.messages.find((msg: any) => room.spotlight?.messageId?.toString() === msg._id.toString())
            : null;

        const recentMessages = room.messages.slice(-200);
        const contributorMap = new Map<string, { user: any; count: number }>();
        recentMessages.forEach((msg: any) => {
            if (!msg.user) return;
            const id = msg.user._id?.toString() || msg.user.toString();
            if (!contributorMap.has(id)) {
                contributorMap.set(id, { user: msg.user, count: 0 });
            }
            contributorMap.get(id)!.count += 1;
        });

        const topContributors = Array.from(contributorMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        res.json({
            ...room.toObject(),
            messages,
            pinnedMessages,
            spotlight: room.spotlight,
            spotlightMessage,
            topContributors
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const postMessage = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        const userId = (req as any).user.id;

        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const newMessage = {
            user: userId,
            text,
            createdAt: new Date()
        };

        room.messages.push(newMessage as any);
        await room.save();

        // Return the populated message
        const populatedRoom = await Room.findById(req.params.id)
            .populate('messages.user', 'name avatar');

        const addedMsg = populatedRoom?.messages[populatedRoom.messages.length - 1];
        res.json(addedMsg);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createRoom = async (req: Request, res: Response) => {
    try {
        const { name, description, icon, topics } = req.body;
        // Check if room exists
        const existing = await Room.findOne({ name });
        if (existing) return res.status(400).json({ message: 'Room already exists' });

        const room = await Room.create({ name, description, icon, topics });
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const togglePinMessage = async (req: Request, res: Response) => {
    try {
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        const { id, messageId } = req.params;
        const room = await Room.findById(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const exists = room.messages.id(messageId as any);
        if (!exists) return res.status(404).json({ message: 'Message not found' });

        room.pinnedMessages = room.pinnedMessages || [];
        const isPinned = room.pinnedMessages.some((mid: any) => mid.toString() === messageId);

        if (isPinned) {
            room.pinnedMessages = room.pinnedMessages.filter((mid: any) => mid.toString() !== messageId);
        } else {
            room.pinnedMessages.push(messageId as any);
        }

        await room.save();
        res.json({ pinnedMessages: room.pinnedMessages });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const setSpotlight = async (req: Request, res: Response) => {
    try {
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        const { id } = req.params;
        const { messageId, title } = req.body;
        const room = await Room.findById(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const message = room.messages.id(messageId as any);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        room.spotlight = {
            messageId: message._id as any,
            title: title || (message.text.length > 80 ? `${message.text.slice(0, 77)}...` : message.text),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        } as any;

        await room.save();
        res.json(room.spotlight);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const clearSpotlight = async (req: Request, res: Response) => {
    try {
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        const { id } = req.params;
        const room = await Room.findById(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        room.spotlight = undefined as any;
        await room.save();
        res.json({ message: 'Spotlight cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Polls ---

export const getPolls = async (req: Request, res: Response) => {
    try {
        const polls = await Poll.find({ isActive: true })
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 });
        res.json(polls);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createPoll = async (req: Request, res: Response) => {
    try {
        const { question, options, expiresAt } = req.body;
        const author = (req as any).user.id;

        if (!question || !Array.isArray(options) || options.length === 0) {
            return res.status(400).json({ message: 'Question and at least one option are required' });
        }

        const formattedOptions = options.map((opt: string) => ({
            text: opt,
            votes: []
        }));

        const poll = await Poll.create({
            question,
            options: formattedOptions,
            expiresAt: expiresAt || new Date(Date.now() + 86400000), // Default 1 day
            author
        });

        res.status(201).json(poll);
    } catch (error: any) {
        console.error('Create Poll Error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

export const votePoll = async (req: Request, res: Response) => {
    try {
        const { optionIndex } = req.body;
        const userId = (req as any).user.id;

        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found' });

        // Remove previous vote if any
        poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(id => id.toString() !== userId);
        });

        // Add new vote
        if (poll.options[optionIndex]) {
            poll.options[optionIndex].votes.push(userId);
        }

        await poll.save();
        res.json(poll);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
