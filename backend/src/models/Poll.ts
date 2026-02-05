import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
    question: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    options: [{
        text: { type: String, required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],

    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Poll = mongoose.model('Poll', pollSchema);
