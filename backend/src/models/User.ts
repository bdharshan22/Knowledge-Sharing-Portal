import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 500 },
    location: { type: String },
    website: { type: String },
    company: { type: String },
    jobTitle: { type: String },

    socials: {
        github: String,
        linkedin: String,
        leetcode: String,
        stackoverflow: String,
        medium: String,
        twitter: String
    },

    // Expertise & Skills
    expertise: [{
        topic: String,
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
        endorsements: { type: Number, default: 0 }
    }],
    skills: [String],

    // Social Features
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Preferences
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
        language: { type: String, default: 'en' },
        learningReminders: {
            enabled: { type: Boolean, default: false },
            time: { type: String, default: '09:00' },
            daysOfWeek: [{ type: Number, default: [] }] // 0-6 (Sun-Sat)
        }
    },

    // Account Status
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastActive: { type: Date, default: Date.now },

    // Gamification
    points: { type: Number, default: 0 },
    badges: [{
        name: String,
        description: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now }
    }],

    // Bookmarks & Collections
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    // Learning Paths
    enrolledPaths: [{
        path: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' },
        progress: { type: Number, default: 0 }, // Percentage 0-100
        completedSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
        milestones: [{ type: Number }],
        lastCompletedAt: { type: Date },
        lastAccessed: { type: Date, default: Date.now },
        enrolledAt: { type: Date, default: Date.now }
    }],

    learningStreak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastStudyDate: { type: Date }
    },

    collections: [{
        name: String,
        description: String,
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
        isPublic: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

userSchema.pre('save', async function () {
    const user = this;
    if (!user.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

// Update last active timestamp
userSchema.methods.updateLastActive = function () {
    this.lastActive = new Date();
    return this.save();
};

// Update last active timestamp
userSchema.methods.updateLastActive = function () {
    this.lastActive = new Date();
    return this.save();
};

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ lastActive: -1 });

export const User = mongoose.model('User', userSchema);
