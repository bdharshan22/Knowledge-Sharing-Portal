import { Request, Response } from 'express';
import { Event } from '../models/Event';

// Create a new event
export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, date, link, type } = req.body;
        const host = (req as any).user.id;

        const event = await Event.create({
            title,
            description,
            date,
            link,
            type,
            host
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get upcoming events
export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.find({
            date: { $gte: new Date() },
            isCancelled: false
        })
            .populate('host', 'name avatar')
            .sort({ date: 1 });

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Register for an event
export const registerEvent = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.id;
        const userId = (req as any).user.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.attendees.includes(userId)) {
            return res.status(400).json({ message: 'Already registered' });
        }

        event.attendees.push(userId);
        await event.save();

        res.json(event.attendees);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel registration (Opt-out)
export const cancelRegistration = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.id;
        const userId = (req as any).user.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.attendees = event.attendees.filter(id => id.toString() !== userId);
        await event.save();

        res.json(event.attendees);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
