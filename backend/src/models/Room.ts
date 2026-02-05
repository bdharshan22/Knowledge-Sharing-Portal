import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String }, // Emoji or icon class

    topics: [String], // Tags like 'React', 'General', 'Help'

    // Embedding messages for simplicity in this MVP. 
    // For production, this should be a separate collection if high volume expected.
    messages: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId }],

    spotlight: {
        messageId: { type: mongoose.Schema.Types.ObjectId },
        title: { type: String },
        createdAt: { type: Date },
        expiresAt: { type: Date }
    },

    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export const Room = mongoose.model('Room', roomSchema);
