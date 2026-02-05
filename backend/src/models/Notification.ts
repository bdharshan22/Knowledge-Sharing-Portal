import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { 
        type: String, 
        enum: [
            'like', 'comment', 'answer', 'follow', 'mention', 
            'badge_earned', 'post_featured', 'answer_accepted',
            'reputation_milestone', 'system_announcement'
        ], 
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        commentId: String,
        answerId: String,
        badgeName: String,
        reputationGained: Number,
        url: String
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);