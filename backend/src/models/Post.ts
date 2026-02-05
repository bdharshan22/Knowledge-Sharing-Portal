import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
    name: String,
    url: String,
    type: String, // 'pdf', 'image', 'video', 'link'
    size: Number
}, { _id: false });

const postSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Content Organization
    type: { type: String, enum: ['article', 'question', 'tutorial', 'discussion', 'resource', 'announcement'], default: 'article' },
    category: { type: String, required: true },
    subcategory: { type: String },
    tags: [{ type: String, maxlength: 30 }],

    // Resources & Attachments
    attachments: [attachmentSchema],

    // Content Quality
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    readingTime: { type: Number }, // in minutes
    language: { type: String, default: 'en' },

    // Engagement Metrics
    views: { type: Number, default: 0 },
    uniqueViews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: { type: Number, default: 0 },

    // Comments & Discussions
    comments: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        text: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        parentComment: { type: mongoose.Schema.Types.ObjectId },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isEdited: { type: Boolean, default: false },
        editedAt: Date,
        createdAt: { type: Date, default: Date.now },
        replies: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            text: { type: String, required: true },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            createdAt: { type: Date, default: Date.now }
        }]
    }],

    // Q&A Specific (for question type posts)
    answers: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        votes: {
            up: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            down: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        },
        isAccepted: { type: Boolean, default: false },
        acceptedAt: Date,
        comments: [{
            text: String,
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }],
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId },

    // Content Status
    status: { type: String, enum: ['draft', 'published', 'archived', 'flagged'], default: 'published' },
    isEdited: { type: Boolean, default: false },
    editHistory: [{
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date, default: Date.now },
        reason: String,
        changes: String
    }],

    // Moderation
    flags: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, enum: ['spam', 'inappropriate', 'duplicate', 'off-topic', 'other'] },
        description: String,
        createdAt: { type: Date, default: Date.now }
    }],
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },

    // SEO & Discovery
    slug: { type: String, unique: true, sparse: true },
    metaDescription: { type: String, maxlength: 160 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },

    // Collaboration
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    allowCollaboration: { type: Boolean, default: false },

    // Visibility
    visibility: {
        type: String,
        enum: ['public', 'private', 'followers'],
        default: 'public',
        index: true
    },

    // Analytics
    analytics: {
        clickThroughRate: { type: Number, default: 0 },
        engagementScore: { type: Number, default: 0 },
        qualityScore: { type: Number, default: 0 }
    },

    // AI Summary
    summary: {
        status: { type: String, enum: ['idle', 'processing', 'ready', 'error'], default: 'idle' },
        tldr: { type: String },
        keyTakeaways: [{ type: String }],
        model: { type: String },
        generatedAt: { type: Date },
        error: { type: String }
    }
}, { timestamps: true });

// Generate slug from title
postSchema.pre('save', function () {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    }

    // Calculate reading time (average 200 words per minute)
    if (this.isModified('content')) {
        const wordCount = this.content.split(/\s+/).length;
        this.readingTime = Math.ceil(wordCount / 200);

        // Generate excerpt if not provided
        if (!this.excerpt) {
            this.excerpt = this.content.substring(0, 300).replace(/<[^>]*>/g, '') + '...';
        }
    }
});

// Calculate engagement score
postSchema.methods.calculateEngagementScore = function () {
    const likes = this.likes.length;
    const comments = this.comments.length;
    const views = this.views;
    const bookmarks = this.bookmarks.length;

    return (likes * 2) + (comments * 3) + (views * 0.1) + (bookmarks * 5);
};

// Get vote score for answers
postSchema.methods.getAnswerScore = function (answerId) {
    const answer = this.answers.id(answerId);
    if (!answer) return 0;
    return answer.votes.up.length - answer.votes.down.length;
};

// Check if user can edit post
postSchema.methods.canEdit = function (userId) {
    return this.author.toString() === userId.toString() ||
        this.collaborators.includes(userId);
};

// Indexes for better performance
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ type: 1, status: 1 });
postSchema.index({ views: -1 });
postSchema.index({ 'analytics.engagementScore': -1 });
postSchema.index({ slug: 1 });
postSchema.index({ featured: 1, trending: 1 });

export const Post = mongoose.model('Post', postSchema);
