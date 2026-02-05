import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, lowercase: true },
    displayName: { type: String, required: true },
    description: { type: String },
    color: { type: String, default: '#6B7280' },

    // Categorization
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    synonyms: [{ type: String, lowercase: true }],
    relatedTags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],

    // Statistics
    usage: {
        postsCount: { type: Number, default: 0 },
        questionsCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 }
    },

    // Moderation
    isApproved: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Wiki-style information
    wiki: {
        excerpt: { type: String, maxlength: 500 },
        body: { type: String },
        lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lastEditedAt: Date
    },

    // Expert tracking
    experts: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 },
        reputation: { type: Number, default: 0 }
    }]
}, { timestamps: true });

// Update usage statistics
tagSchema.methods.updateUsage = function (type = 'post') {
    if (type === 'question') {
        this.usage.questionsCount += 1;
    } else {
        this.usage.postsCount += 1;
    }
    return this.save();
};

// Get top experts for this tag
tagSchema.methods.getTopExperts = function (limit = 5) {
    return this.experts
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);
};

// Find related tags based on co-occurrence
tagSchema.statics.findRelated = async function (tagName, limit = 10) {
    const posts = await mongoose.model('Post').find({
        tags: tagName,
        status: 'published'
    }).select('tags');

    const tagCounts: Record<string, number> = {};
    posts.forEach((post: any) => {
        post.tags.forEach((tag: string) => {
            if (tag !== tagName) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        });
    });

    const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag]) => tag);

    return this.find({ name: { $in: sortedTags } });
};

// Indexes
tagSchema.index({ name: 1 });
tagSchema.index({ 'usage.postsCount': -1 });
tagSchema.index({ isFeatured: 1, 'usage.postsCount': -1 });
tagSchema.index({ category: 1 });

export const Tag = mongoose.model('Tag', tagSchema);