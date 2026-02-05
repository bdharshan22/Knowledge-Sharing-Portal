import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String },
    galleryImages: [String],

    repoLink: { type: String },
    demoLink: { type: String },

    tags: [String],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],

    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Project = mongoose.model('Project', projectSchema);
