import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String }, // URL to image
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Ordered modules containing steps (Posts)
    modules: [{
        title: { type: String, required: true },
        steps: [{
            post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
            title: { type: String, required: true }, // Optional override or cache
            isOptional: { type: Boolean, default: false }
        }]
    }],

    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    tags: [String],

    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes
learningPathSchema.index({ title: 'text', description: 'text' });
learningPathSchema.index({ tags: 1 });
learningPathSchema.index({ author: 1 });

export const LearningPath = mongoose.model('LearningPath', learningPathSchema);
