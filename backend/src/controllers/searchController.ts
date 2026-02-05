import { Request, Response } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Project } from '../models/Project';

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const { q, type, tag, difficulty, time } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const regex = new RegExp(q, 'i');
        const postQuery: any = {
            $or: [{ title: regex }, { content: regex }, { tags: regex }],
            moderationStatus: 'approved'
        };

        if (type && typeof type === 'string') {
            postQuery.type = type;
        }

        if (difficulty && typeof difficulty === 'string') {
            postQuery.difficulty = difficulty;
        }

        if (tag && typeof tag === 'string') {
            postQuery.tags = { $in: [new RegExp(tag, 'i')] };
        }

        if (time && typeof time === 'string') {
            const now = new Date();
            const days = time === 'week' ? 7 : time === 'month' ? 30 : 0;
            if (days > 0) {
                postQuery.createdAt = { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
            }
        }

        // Run queries in parallel
        const [posts, users, projects] = await Promise.all([
            Post.find(postQuery)
                .select('title content tags category createdAt author type difficulty likes bookmarks comments views isEdited editHistory')
                .populate('author', 'name avatar')
                .limit(10),

            User.find({
                $or: [{ name: regex }, { username: regex }, { skills: regex }]
            })
                .select('name username avatar bio skills')
                .limit(10),

            Project.find({
                $or: [{ title: regex }, { description: regex }, { tags: regex }]
            })
                .select('title description tags coverImage author')
                .populate('author', 'name avatar')
                .limit(10)
        ]);

        res.json({
            posts,
            users,
            projects
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
