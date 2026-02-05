import { Request, Response } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';

const getBlockedTerms = () => {
    const raw = process.env.CONTENT_FILTER_WORDS || '';
    return raw
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(Boolean);
};

const findBlockedTerm = (text: string) => {
    const terms = getBlockedTerms();
    if (!terms.length) return null;
    const normalized = text.toLowerCase();
    return terms.find(term => normalized.includes(term)) || null;
};


export const createPost = async (req: Request, res: Response) => {
    try {
        console.log('Create Post Body:', JSON.stringify(req.body, null, 2)); // Debug Log
        const { title, content, tags, category, visibility, type, difficulty, attachments } = req.body;
        const userId = (req as any).user.id;

        if (!title || !content || !category) {
            return res.status(400).json({ message: 'Title, content, and category are required' });
        }

        const blockedTerm = findBlockedTerm(`${title} ${content}`);

        const post = await Post.create({
            title,
            content,
            tags: tags || [],
            category,
            type: type || 'article',
            difficulty: difficulty || 'Beginner',
            attachments: attachments || [],
            visibility: visibility || 'public',
            author: userId,
            moderationStatus: blockedTerm ? 'pending' : 'approved',
            flags: blockedTerm
                ? [{
                    user: userId,
                    reason: 'inappropriate',
                    description: `Auto-flagged term: "${blockedTerm}"`
                }]
                : []
        });

        res.status(201).json(post);
    } catch (error: any) {
        console.error('Create Post Error:', error);
        res.status(500).json({
            message: error.message || 'Server error',
            details: error.errors ? Object.values(error.errors).map((e: any) => e.message) : undefined
        });
    }
};

export const getPosts = async (req: Request, res: Response) => {
    try {
        const { search, category, sort, author } = req.query;
        let query: any = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        let sortOption: any = { createdAt: -1 }; // Default: Newest

        if (sort === 'top') {
            sortOption = { 'likes': -1 }; // Sort by likes array length isn't directly possibly like this in Mongo standard sort, but usually we use a virtual or just field if available. 
            // NOTE: Mongoose sort by array length is tricky. For simplicity in this MVP, we will assume 'votes' count is stored or we rely on the client side or a simplified 'views' metric if likes is an array.
            // BETTER APPROACH: Use the 'stats.likesReceived' if available on POST, but currently Post model has 'likes' array.
            // WORKAROUND: For now, we'll sort by 'views' for 'popular' if likes count isn't indexed, OR we can try to aggregate. 
            // LET'S USE AGGREGATE for best results, OR just sort by views for now to keep it simple and fast.
            // actually, let's use views for "Trending/Top" to avoid complex aggregation for this step.
            sortOption = { views: -1 };
        } else if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        // If we really want to sort by likes length, we'd need an aggregation pipeline.
        // For this step, let's assume we sort by views for "Popular" to keep it robust.

        // Visibility Filter
        const userId = (req as any).user ? (req as any).user.id : null;
        let userFollowing: any[] = [];

        if (userId) {
            const currentUser = await User.findById(userId);
            if (currentUser) {
                userFollowing = currentUser.following || [];
            }
        }

        const visibilityFilter = {
            $or: [
                { visibility: 'public' }, // Everyone sees public
                { visibility: 'private', author: userId }, // Author sees own private
                // Author sees own followers-only OR User sees followers-only from people they follow
                { visibility: 'followers', author: { $in: [...userFollowing, userId] } }
            ]
        };

        if (author) {
            if (author === 'me' && userId) {
                query.author = userId;
            } else if (typeof author === 'string') {
                query.author = author;
            }
        }

        const moderationFilter = userId
            ? { $or: [{ moderationStatus: 'approved' }, { author: userId }] }
            : { moderationStatus: 'approved' };

        // Merge with existing query
        query = { ...query, ...visibilityFilter, ...moderationFilter };

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find(query)
            .select('-content -editHistory -analytics -flags') // Exclude heavy fields
            .populate('author', 'name email avatar')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPostById = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.views = (post.views || 0) + 1;

        const userId = (req as any).user?.id;
        if (userId) {
            post.uniqueViews = post.uniqueViews || [];
            const hasViewed = post.uniqueViews.some((id: any) => id.toString() === userId);
            if (!hasViewed) {
                post.uniqueViews.push(userId as any);
            }
        }

        await post.save();

        const populatedPost = await Post.findById(req.params.id)
            .populate('author', 'name email avatar')
            .populate('comments.user', 'name email avatar')
            .populate('editHistory.editedBy', 'name avatar');

        res.json(populatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== (req as any).user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await post.deleteOne();
        res.json({ message: 'Post removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = (req as any).user.id;
        const isCollaborator = Array.isArray(post.collaborators)
            ? post.collaborators.some((id: any) => id.toString() === userId)
            : false;

        if (post.author.toString() !== userId && !isCollaborator) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const {
            title,
            content,
            tags,
            category,
            visibility,
            type,
            difficulty,
            attachments,
            editReason
        } = req.body;

        const trimText = (value: string | undefined, limit = 1200) => {
            if (!value) return value;
            return value.length > limit ? `${value.slice(0, limit)}...` : value;
        };

        const changes: any = {};
        if (title !== undefined && title !== post.title) {
            changes.title = { from: post.title, to: title };
        }
        if (content !== undefined && content !== post.content) {
            changes.content = { from: trimText(post.content), to: trimText(content) };
        }
        if (category !== undefined && category !== post.category) {
            changes.category = { from: post.category, to: category };
        }
        if (visibility !== undefined && visibility !== post.visibility) {
            changes.visibility = { from: post.visibility, to: visibility };
        }
        if (type !== undefined && type !== post.type) {
            changes.type = { from: post.type, to: type };
        }
        if (difficulty !== undefined && difficulty !== post.difficulty) {
            changes.difficulty = { from: post.difficulty, to: difficulty };
        }
        if (tags !== undefined) {
            const nextTags = Array.isArray(tags)
                ? tags
                : typeof tags === 'string'
                    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                    : post.tags;
            if (JSON.stringify(nextTags) !== JSON.stringify(post.tags)) {
                changes.tags = { from: post.tags, to: nextTags };
            }
        }

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (category !== undefined) post.category = category;
        if (visibility !== undefined) post.visibility = visibility;
        if (type !== undefined) post.type = type;
        if (difficulty !== undefined) post.difficulty = difficulty;
        if (attachments !== undefined) post.attachments = attachments;

        if (tags !== undefined) {
            if (Array.isArray(tags)) {
                post.tags = tags;
            } else if (typeof tags === 'string') {
                post.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
        }

        const blockedTerm = findBlockedTerm(`${post.title} ${post.content}`);
        if (blockedTerm) {
            post.moderationStatus = 'pending';
            post.flags = post.flags || [];
            post.flags.push({
                user: userId,
                reason: 'inappropriate',
                description: `Auto-flagged term: "${blockedTerm}"`
            } as any);
        }

        if (Object.keys(changes).length > 0) {
            post.isEdited = true;
            post.editHistory = post.editHistory || [];
            post.editHistory.push({
                editedBy: userId,
                editedAt: new Date(),
                reason: editReason || 'Updated post',
                changes: JSON.stringify(changes)
            } as any);
        }

        await post.save();

        const updatedPost = await Post.findById(req.params.id)
            .populate('author', 'name email avatar')
            .populate('comments.user', 'name email avatar')
            .populate('editHistory.editedBy', 'name avatar');

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const likePost = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = (req as any).user.id;
        const authorId = post.author.toString();

        if (post.likes.includes(userId)) {
            // Unlike
            post.likes = post.likes.filter((id) => id.toString() !== userId);
        } else {
            // Like
            post.likes.push(userId);
        }

        await post.save();

        res.json(post.likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const toggleBookmark = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const user = await User.findById(userId);
        const post = await Post.findById(id);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const isBookmarked = user.bookmarks.some((bookmarkId: any) => bookmarkId.toString() === id);

        if (isBookmarked) {
            (user.bookmarks as any).pull(id);
            (post.bookmarks as any).pull(userId);
        } else {
            user.bookmarks.push(id as any);
            post.bookmarks.push(userId as any);
        }

        await user.save();
        await post.save();

        res.json({
            isBookmarked: !isBookmarked,
            bookmarksCount: post.bookmarks.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const reportPost = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = (req as any).user.id;
        const { reason = 'other', description = '' } = req.body || {};
        const allowedReasons = ['spam', 'inappropriate', 'duplicate', 'off-topic', 'other'];
        const normalizedReason = typeof reason === 'string'
            ? reason.trim().toLowerCase()
            : 'other';
        const safeReason = allowedReasons.includes(normalizedReason) ? normalizedReason : 'other';

        post.flags = post.flags || [];
        post.flags.push({
            user: userId,
            reason: safeReason,
            description,
            createdAt: new Date()
        } as any);

        post.moderationStatus = 'pending';
        await post.save();

        res.json({ message: 'Report received', moderationStatus: post.moderationStatus });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const generateSummary = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(501).json({ message: 'AI summaries are not configured' });
        }

        const model = process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini';

        post.summary = post.summary || { status: 'idle' } as any;
        if (post.summary) {
            post.summary.status = 'processing';
        }
        await post.save();

        const prompt = `Summarize the following post. Return JSON with keys: tldr (string) and keyTakeaways (array of 3-5 short bullet strings).\\n\\nTitle: ${post.title}\\n\\nContent:\\n${post.content}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: 'You are a concise technical summarizer. Respond only with JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (post.summary) {
                post.summary.status = 'error';
                post.summary.error = errorText;
            }
            await post.save();
            return res.status(500).json({ message: 'Failed to generate summary' });
        }

        const data = await response.json();
        const raw = data?.choices?.[0]?.message?.content || '';
        let parsed: any = null;
        try {
            parsed = JSON.parse(raw);
        } catch {
            // Try to extract JSON from text
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        }

        const tldr = parsed?.tldr || '';
        const keyTakeaways = Array.isArray(parsed?.keyTakeaways) ? parsed.keyTakeaways : [];

        post.summary = {
            status: 'ready',
            tldr,
            keyTakeaways,
            model,
            generatedAt: new Date()
        } as any;

        await post.save();

        res.json(post.summary);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const { text } = req.body;
        const comment = {
            text,
            user: (req as any).user.id,
            createdAt: new Date()
        };

        post.comments.push(comment as any);
        await post.save();

        // Populate user for the new comment to return it
        const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'name email');
        res.json(updatedPost?.comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
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

// -- Answer Logic --

export const addAnswer = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const { content } = req.body;
        const answer = {
            content,
            author: (req as any).user.id,
            createdAt: new Date(),
            votes: { up: [], down: [] }
        };

        post.answers.push(answer as any);
        await post.save();

        post.answers.push(answer as any);
        await post.save();

        const updatedPost = await Post.findById(req.params.id).populate('answers.author', 'name email avatar');
        res.json(updatedPost?.answers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const acceptAnswer = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.id as string);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author.toString() !== (req as any).user.id) {
            return res.status(401).json({ message: 'Only the author can accept an answer' });
        }

        const answerId = req.params.answerId as string;
        const answer = post.answers.id(answerId);

        if (!answer) return res.status(404).json({ message: 'Answer not found' });

        // Un-accept previous answer if any
        post.answers.forEach((ans: any) => {
            ans.isAccepted = false;
        });

        answer.isAccepted = true;
        answer.acceptedAt = new Date();
        post.acceptedAnswer = answer._id;

        await post.save();

        await post.save();

        res.json(post.answers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const voteAnswer = async (req: Request, res: Response) => {
    try {
        const { type } = req.body; // 'up' or 'down'
        const post = await Post.findById(req.params.id as string);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const answer = post.answers.id(req.params.answerId as string);
        if (!answer) return res.status(404).json({ message: 'Answer not found' });

        const userId = (req as any).user.id;

        // Initialize votes if somehow missing (though schema default handles this, strict NULL checks might complain)
        if (!answer.votes) {
            answer.votes = { up: [], down: [] };
        }

        // Remove existing votes
        answer.votes.up = answer.votes.up.filter((id: any) => id.toString() !== userId);
        answer.votes.down = answer.votes.down.filter((id: any) => id.toString() !== userId);

        if (type === 'up') {
            answer.votes.up.push(userId);
        } else if (type === 'down') {
            answer.votes.down.push(userId);
        }

        await post.save();



        res.json(answer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Personalized Feed
export const getFeed = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const followingIds = user.following || [];
        const topicSet = new Set(
            [
                ...(user.skills || []),
                ...(user.expertise || []).map((e: any) => e.topic)
            ]
                .filter(Boolean)
                .map((t: string) => t.toLowerCase())
        );
        const bookmarkSet = new Set((user.bookmarks || []).map((id: any) => id.toString()));

        const visibilityFilter = {
            $or: [
                { visibility: 'public' },
                { visibility: 'private', author: userId },
                { visibility: 'followers', author: { $in: [...followingIds, userId] } }
            ]
        };

        const moderationFilter = { $or: [{ moderationStatus: 'approved' }, { author: userId }] };

        const candidatePosts = await Post.find({
            ...visibilityFilter,
            ...moderationFilter
        })
            .select('title excerpt author createdAt likes comments bookmarks views type tags category difficulty visibility')
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(200);

        const now = Date.now();

        const scored = candidatePosts.map((post: any) => {
            const tags = (post.tags || []).map((t: string) => t.toLowerCase());
            const tagOverlap = tags.filter((t: string) => topicSet.has(t));
            const fromFollowing = followingIds.some((id: any) => id.toString() === post.author?._id?.toString());
            const isBookmarked = bookmarkSet.has(post._id.toString());

            const engagementScore =
                (post.likes?.length || 0) * 2 +
                (post.comments?.length || 0) * 3 +
                (post.bookmarks?.length || 0) * 5 +
                (post.views || 0) * 0.1;

            const hoursAgo = Math.max(1, (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
            const recencyBoost = Math.max(0, 48 - hoursAgo);
            const topicBoost = tagOverlap.length * 12;
            const followingBoost = fromFollowing ? 40 : 0;
            const savedBoost = isBookmarked ? 15 : 0;

            const score = engagementScore + recencyBoost + topicBoost + followingBoost + savedBoost;

            const reasons: string[] = [];
            if (fromFollowing) reasons.push('From someone you follow');
            if (tagOverlap.length) reasons.push(`Matches your topics: ${tagOverlap.slice(0, 2).join(', ')}`);
            if (post.bookmarks?.length >= 5) reasons.push('Popular saves');
            if (engagementScore > 20) reasons.push('High engagement');

            return { post, score, feedReasons: reasons, isFollowingAuthor: fromFollowing };
        });

        const ranked = scored
            .sort((a: any, b: any) => b.score - a.score)
            .slice((page - 1) * limit, page * limit)
            .map((item: any) => ({
                ...item.post.toObject(),
                feedReasons: item.feedReasons,
                isFollowingAuthor: item.isFollowingAuthor
            }));

        res.json(ranked);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
