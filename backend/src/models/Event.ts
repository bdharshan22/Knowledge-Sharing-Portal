import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    link: { type: String }, // Virtual meeting link

    type: {
        type: String,
        enum: ['Webinar', 'Workshop', 'AMA', 'Meetup'],
        default: 'Webinar'
    },

    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isCancelled: { type: Boolean, default: false }
}, { timestamps: true });

eventSchema.index({ date: 1 });

export const Event = mongoose.model('Event', eventSchema);
