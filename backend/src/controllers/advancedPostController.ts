import { Request, Response } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Tag } from '../models/Tag';
import { Notification } from '../models/Notification';

// Get all posts with advanced filtering
export const getPosts = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            tags,
            type,
            difficulty,
            sort = 'recent',
            author,
            featured,
            trending
        } = req.query;

        let query: any = { status: 'published' };
        let sortOptions: any = {};

        if (search) query.$text = { $search: search as string };
        if (category) query.category = category;
        if (tags) query.tags = { $in: (tags as string).split(',') };
        if (type) query.type = type;
        if (difficulty) query.difficulty = difficulty;
        if (author) query.author = author;
        if (featured === 'true') query.featured = true;
        if (trending === 'true') query.trending = true;

        switch (sort) {
            case 'popular': sortOptions = { 'analytics.engagementScore': -1 }; break;
            case 'views': sortOptions = { views: -1 }; break;
            case 'likes': sortOptions = { 'likes.length': -1 }; break;
            case 'oldest': sortOptions = { createdAt: 1 }; break;
            default: sortOptions = { createdAt: -1 };
        }

        const posts = await Post.find(query)
            .populate('author', 'name username avatar reputation')
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .select('-content');

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get single post
export const getPostById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const post = await Post.findById(id)
            .populate('author', 'name username avatar reputation badges')
            .populate('comments.user', 'name username avatar')
            .populate('answers.author', 'name username avatar reputation');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Increment view count
        if (userId && !post.uniqueViews.includes(userId)) {
            post.views += 1;
            post.uniqueViews.push(userId);
            await post.save();
        }

        res.json({ post });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create new post
export const createPost = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const postData = { ...req.body, author: userId };

        const post = new Post(postData);
        await post.save();

        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.postsCount': 1, points: 10 }
        });

        await post.populate('author', 'name username avatar');
        res.status(201).json({ post });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete post
export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== userId && (req as any).user?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Post.findByIdAndDelete(id);
        await User.findByIdAndUpdate(post.author, {
            $inc: { 'stats.postsCount': -1 }
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Like/Unlike post
export const likePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isLiked = post.likes.includes(userId);
        
        if (isLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
            post.dislikes.pull(userId);

            if (post.author.toString() !== userId) {
                await Notification.create({
                    recipient: post.author,
                    sender: userId,
                    type: 'like',
                    title: 'Post Liked',
                    message: 'Someone liked your post',
                    data: { postId: post._id }
                });
            }
        }

        await post.save();
        res.json({
            isLiked: !isLiked,
            likesCount: post.likes.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add comment
export const addComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { text, parentComment } = req.body;
        const userId = (req as any).user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (parentComment) {
            const comment = post.comments.id(parentComment);
            if (!comment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
            comment.replies.push({ text, user: userId, createdAt: new Date() });
        } else {
            post.comments.push({ text, user: userId, createdAt: new Date() });
        }

        await post.save();
        await post.populate('comments.user', 'name username avatar');

        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.commentsCount': 1 }
        });

        if (post.author.toString() !== userId) {
            await Notification.create({
                recipient: post.author,
                sender: userId,
                type: 'comment',
                title: 'New Comment',
                message: 'Someone commented on your post',
                data: { postId: post._id }
            });
        }

        res.json({ comments: post.comments });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add answer (for questions)
export const addAnswer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = (req as any).user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.type !== 'question') {
            return res.status(400).json({ message: 'Can only add answers to questions' });
        }

        post.answers.push({
            content,
            author: userId,
            votes: { up: [], down: [] },
            createdAt: new Date()
        });

        await post.save();
        await post.populate('answers.author', 'name username avatar reputation');

        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.answersCount': 1 }
        });

        if (post.author.toString() !== userId) {
            await Notification.create({
                recipient: post.author,
                sender: userId,
                type: 'answer',
                title: 'New Answer',
                message: 'Someone answered your question',
                data: { postId: post._id }
            });
        }

        res.json({ answers: post.answers });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Vote on answer
export const voteAnswer = async (req: Request, res: Response) => {
    try {
        const { id, answerId } = req.params;
        const { voteType } = req.body;
        const userId = (req as any).user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const answer = post.answers.id(answerId);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        answer.votes.up.pull(userId);
        answer.votes.down.pull(userId);

        if (voteType === 'up') {
            answer.votes.up.push(userId);
        } else if (voteType === 'down') {
            answer.votes.down.push(userId);
        }

        await post.save();

        const score = answer.votes.up.length - answer.votes.down.length;
        res.json({ score, voteType });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Accept answer
export const acceptAnswer = async (req: Request, res: Response) => {
    try {
        const { id, answerId } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'Only question author can accept answers' });
        }

        const answer = post.answers.id(answerId);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        if (post.acceptedAnswer) {
            const prevAnswer = post.answers.id(post.acceptedAnswer);
            if (prevAnswer) prevAnswer.isAccepted = false;
        }

        answer.isAccepted = true;
        answer.acceptedAt = new Date();
        post.acceptedAnswer = answerId;

        await post.save();

        await Notification.create({
            recipient: answer.author,
            sender: userId,
            type: 'answer_accepted',
            title: 'Answer Accepted',
            message: 'Your answer was accepted',
            data: { postId: post._id, answerId }
        });

        res.json({ message: 'Answer accepted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Bookmark post
export const toggleBookmark = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const user = await User.findById(userId);
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isBookmarked = user.bookmarks.includes(id);

        if (isBookmarked) {
            user.bookmarks.pull(id);
            post.bookmarks.pull(userId);
        } else {
            user.bookmarks.push(id);
            post.bookmarks.push(userId);
        }

        await user.save();
        await post.save();

        res.json({
            isBookmarked: !isBookmarked,
            bookmarksCount: post.bookmarks.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(req.params.commentId as string);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.user?.toString() !== (req as any).user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        comment.deleteOne();
        await post.save();
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};