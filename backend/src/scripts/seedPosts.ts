import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';

dotenv.config();

const getOrCreateUsers = async () => {
    const users = await User.find().limit(3);
    if (users.length >= 2) return users;

    const demoUsers = await User.create([
        {
            name: 'Demo Author',
            email: 'demo.author@example.com',
            password: 'password123',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Demo+Author&background=0ea5e9&color=fff'
        },
        {
            name: 'Dev Mentor',
            email: 'dev.mentor@example.com',
            password: 'password123',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Dev+Mentor&background=6366f1&color=fff'
        },
        {
            name: 'Product Builder',
            email: 'product.builder@example.com',
            password: 'password123',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Product+Builder&background=14b8a6&color=fff'
        }
    ]);

    return demoUsers;
};

const seedPosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('MongoDB Connected');

        const users = await getOrCreateUsers();
        const [userA, userB, userC] = users;

        const samples = [
            {
                title: 'Building a Reliable React Data Fetching Layer',
                content: 'A practical guide to caching, request deduping, and optimistic updates. Learn how to avoid flicker and keep UI state consistent during slow networks.',
                author: userA._id,
                category: 'Frontend',
                type: 'article',
                tags: ['react', 'state', 'performance'],
                difficulty: 'Intermediate',
                views: 182,
                likes: [userB._id],
                comments: [{ text: 'Clear and actionable breakdown. Great patterns!', user: userB._id }]
            },
            {
                title: 'Question: How do you structure large TypeScript projects?',
                content: 'I am struggling with folder structure and shared types. Any tips for keeping a large TypeScript codebase maintainable?',
                author: userB._id,
                category: 'Architecture',
                type: 'question',
                tags: ['typescript', 'architecture', 'best-practices'],
                difficulty: 'Beginner',
                views: 96,
                likes: [userA._id],
                answers: [
                    {
                        content: 'Start with feature-based folders, keep shared types in a common package, and use strict boundaries with lint rules.',
                        author: userA._id,
                        votes: { up: [userC._id], down: [] }
                    }
                ]
            },
            {
                title: 'Designing APIs That Scale With Product Growth',
                content: 'Focus on clear resource naming, predictable pagination, and versioning strategy. This post covers pitfalls to avoid and patterns that keep APIs flexible.',
                author: userC._id,
                category: 'Backend',
                type: 'article',
                tags: ['api', 'backend', 'design'],
                difficulty: 'Advanced',
                views: 210,
                likes: [userA._id, userB._id]
            },
            {
                title: 'Question: How do you balance speed vs quality for side projects?',
                content: 'I want to ship quickly but not accrue too much technical debt. How do you decide what is good enough?',
                author: userA._id,
                category: 'Career',
                type: 'question',
                tags: ['productivity', 'engineering', 'growth'],
                difficulty: 'Intermediate',
                views: 74,
                likes: [userC._id],
                answers: [
                    {
                        content: 'Define a minimal quality bar, write tests for core flows, and backlog the rest. Timebox refactors.',
                        author: userC._id,
                        votes: { up: [userB._id], down: [] }
                    }
                ]
            }
        ];

        let createdCount = 0;
        for (const sample of samples) {
            const existing = await Post.findOne({ title: sample.title });
            if (existing) continue;
            await Post.create(sample);
            createdCount += 1;
        }

        console.log(`Inserted ${createdCount} posts.`);
        process.exit();
    } catch (error) {
        console.error('Error seeding posts:', error);
        process.exit(1);
    }
};

seedPosts();
