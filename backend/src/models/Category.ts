import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String }, // Icon class or URL
    color: { type: String, default: '#3B82F6' }, // Hex color code

    // Hierarchy
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    level: { type: Number, default: 0 },
    path: { type: String }, // e.g., "technology/web-development/react"

    // Content & Moderation
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rules: [{ type: String }],
    guidelines: { type: String },

    // Statistics
    stats: {
        postsCount: { type: Number, default: 0 },
        questionsCount: { type: Number, default: 0 },
        answersCount: { type: Number, default: 0 },
        subscribersCount: { type: Number, default: 0 },
        totalViews: { type: Number, default: 0 }
    },

    // Settings
    isActive: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    allowQuestions: { type: Boolean, default: true },
    allowArticles: { type: Boolean, default: true },
    allowDiscussions: { type: Boolean, default: true },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },

    // Display
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
}, { timestamps: true });

// Generate slug and path before saving
categorySchema.pre('save', async function () {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Generate path for hierarchy
    if (this.parent) {
        // @ts-ignore
        const parent = await this.constructor.findById(this.parent);
        if (parent) {
            this.path = parent.path ? `${parent.path}/${this.slug}` : this.slug;
            this.level = parent.level + 1;
        }
    } else {
        this.path = this.slug;
        this.level = 0;
    }
});

// Get full category tree
categorySchema.methods.getFullTree = async function () {
    // @ts-ignore
    const categories = await this.constructor.find({ isActive: true }).sort({ level: 1, order: 1 });

    const buildTree = (parentId: any = null): any[] => {
        return categories
            .filter((cat: any) => String(cat.parent || null) === String(parentId))
            .map((cat: any) => ({
                ...cat.toObject(),
                children: buildTree(cat._id)
            }));
    };

    return buildTree();
};

// Get category breadcrumbs
categorySchema.methods.getBreadcrumbs = async function () {
    const breadcrumbs = [];
    let current = this;

    while (current) {
        breadcrumbs.unshift({
            _id: current._id,
            name: current.name,
            slug: current.slug,
            path: current.path
        });

        if (current.parent) {
            // @ts-ignore
            current = await this.constructor.findById(current.parent);
        } else {
            current = null;
        }
    }

    return breadcrumbs;
};

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ featured: 1, order: 1 });
categorySchema.index({ 'stats.postsCount': -1 });

export const Category = mongoose.model('Category', categorySchema);