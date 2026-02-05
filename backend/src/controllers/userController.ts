import { Request, Response } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { uploadFile } from '../utils/cloudinary';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.params;
        const user = await User.findById(userId)
            .select('-password')
            .populate('followers', 'name username avatar')
            .populate('following', 'name username avatar');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's recent posts
        const recentPosts = await Post.find({
            author: userId
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('author', 'name username avatar');

        // Calculate additional stats
        const stats = {
            joinedDaysAgo: Math.floor((Date.now() - (user as any).createdAt.getTime()) / (1000 * 60 * 60 * 24))
        };

        res.json({
            user: { ...user.toObject(), stats },
            recentPosts
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const updates = req.body;

        // Remove sensitive fields
        delete updates.password;
        delete updates.email;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Upload avatar
export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const result: any = await uploadFile(req.file.buffer, 'avatars', 'image');

        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: result.secure_url },
            { new: true }
        ).select('-password');

        res.json({ user, avatarUrl: result.secure_url });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Follow/Unfollow user
export const toggleFollow = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { targetUserId } = req.params;

        if (userId === targetUserId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isFollowing = user.following.includes(targetUserId as any);

        if (isFollowing) {
            // Unfollow
            user.following = user.following.filter(id => id.toString() !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
        } else {
            // Follow
            user.following.push(targetUserId as any);
            targetUser.followers.push(userId as any);
        }

        await user.save();
        await targetUser.save();

        res.json({
            isFollowing: !isFollowing,
            followersCount: targetUser.followers.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get user's activity feed
export const getUserActivity = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        // Fetch posts by user
        const postsPromise = Post.find({ author: userId })
            .select('title content type category createdAt slug views likes comments')
            .lean();

        // Fetch posts where user commented
        const commentedPostsPromise = Post.find({ 'comments.user': userId })
            .select('title _id comments slug type')
            .lean();

        const [posts, commentedPosts] = await Promise.all([postsPromise, commentedPostsPromise]);

        // Normalize posts
        const postActivities = posts.map((post: any) => ({
            _id: post._id,
            type: 'post',
            title: post.title,
            excerpt: post.content?.substring(0, 100) + '...',
            timestamp: post.createdAt,
            data: {
                category: post.category,
                views: post.views,
                likes: post.likes?.length || 0,
                comments: post.comments?.length || 0,
                slug: post.slug
            }
        }));

        // Normalize comments
        const commentActivities: any[] = [];
        commentedPosts.forEach((post: any) => {
            post.comments.filter((c: any) => c.user.toString() === userId).forEach((comment: any) => {
                commentActivities.push({
                    _id: comment._id,
                    type: 'comment',
                    title: `Commented on: ${post.title}`,
                    excerpt: comment.text.substring(0, 100) + '...',
                    timestamp: comment.createdAt,
                    data: {
                        postId: post._id,
                        postSlug: post.slug,
                        postType: post.type
                    }
                });
            });
        });

        // Combine and sort
        const allActivities = [...postActivities, ...commentActivities].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Paginate
        const paginatedActivities = allActivities.slice(skip, skip + Number(limit));

        res.json({
            activities: paginatedActivities,
            total: allActivities.length,
            page: Number(page),
            pages: Math.ceil(allActivities.length / Number(limit))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get user's bookmarks
export const getUserBookmarks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { page = 1, limit = 50 } = req.query;

        const user = await User.findById(userId)
            .populate({
                path: 'bookmarks',
                populate: {
                    path: 'author',
                    select: 'name username avatar'
                }
            });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const bookmarks = Array.isArray(user.bookmarks) ? user.bookmarks : [];
        const paged = bookmarks.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

        res.json({ bookmarks: paged, total: bookmarks.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Search users
export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { q, skills, location, limit = 20 } = req.query;

        let query: any = { isActive: true };

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { bio: { $regex: q, $options: 'i' } }
            ];
        }

        if (skills) {
            const skillsArray = (skills as string).split(',');
            query.skills = { $in: skillsArray };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        const users = await User.find(query)
            .select('name username avatar bio location skills')
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateLearningReminders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { enabled, time, daysOfWeek } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.preferences = user.preferences || ({} as any);
        user.preferences.learningReminders = {
            enabled: typeof enabled === 'boolean' ? enabled : user.preferences.learningReminders?.enabled || false,
            time: time || user.preferences.learningReminders?.time || '09:00',
            daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : user.preferences.learningReminders?.daysOfWeek || []
        } as any;

        await user.save();
        res.json({ learningReminders: user.preferences.learningReminders });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// --- Collections ---

export const getCollections = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const user = await User.findById(userId).select('collections');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ collections: user.collections || [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getCollectionById = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { collectionId } = req.params;

        const user = await User.findById(userId)
            .populate({
                path: 'collections.posts',
                populate: { path: 'author', select: 'name username avatar' }
            });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const collection = user.collections?.find((c: any) => c._id.toString() === collectionId);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        res.json({ collection });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createCollection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { name, description = '', isPublic = false } = req.body || {};

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Collection name is required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.collections = user.collections || [];
        user.collections.push({
            name: name.trim(),
            description,
            posts: [],
            isPublic: !!isPublic,
            createdAt: new Date()
        } as any);

        await user.save();
        res.status(201).json({ collections: user.collections });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateCollection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { collectionId } = req.params;
        const { name, description, isPublic } = req.body || {};

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const collection = user.collections?.find((c: any) => c._id.toString() === collectionId);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        if (name !== undefined) collection.name = name;
        if (description !== undefined) collection.description = description;
        if (isPublic !== undefined) collection.isPublic = !!isPublic;

        await user.save();
        res.json({ collection });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteCollection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { collectionId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.collections = (user.collections || []).filter((c: any) => c._id.toString() !== collectionId);
        await user.save();

        res.json({ collections: user.collections });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const addPostToCollection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { collectionId } = req.params;
        const { postId } = req.body || {};

        if (!postId) return res.status(400).json({ message: 'postId is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const collection = user.collections?.find((c: any) => c._id.toString() === collectionId);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        collection.posts = collection.posts || [];
        const exists = collection.posts.some((id: any) => id.toString() === postId);
        if (!exists) {
            collection.posts.push(postId as any);
        }

        await user.save();
        res.json({ collection });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const removePostFromCollection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { collectionId, postId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const collection = user.collections?.find((c: any) => c._id.toString() === collectionId);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });

        collection.posts = (collection.posts || []).filter((id: any) => id.toString() !== postId);
        await user.save();

        res.json({ collection });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
