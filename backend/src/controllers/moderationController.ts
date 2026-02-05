import { Request, Response } from 'express';
import { Post } from '../models/Post';
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

export const getFlaggedPosts = async (req: Request, res: Response) => {
    try {
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        const posts = await Post.find({
            $or: [
                { 'flags.0': { $exists: true } },
                { moderationStatus: 'pending' }
            ]
        })
            .populate('author', 'name avatar')
            .sort({ updatedAt: -1 });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const resolvePost = async (req: Request, res: Response) => {
    try {
        const moderator = await requireModerator(req, res);
        if (!moderator) return;

        const { status, note } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.moderationStatus = status;
        if (status === 'approved') {
            post.flags = [] as any;
        }
        if (note) {
            post.editHistory = post.editHistory || [];
            post.editHistory.push({
                editedBy: (req as any).user.id,
                editedAt: new Date(),
                reason: note
            } as any);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
