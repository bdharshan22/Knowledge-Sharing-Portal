import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { LearningPath } from '../models/LearningPath';
import { Project } from '../models/Project';
import { Event } from '../models/Event';


dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Post.deleteMany({});
        await LearningPath.deleteMany({});
        await Project.deleteMany({});
        await Event.deleteMany({});
        console.log('Cleared existing data.');

        // 1. Create Users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
        });

        const jane = await User.create({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=random'
        });

        const john = await User.create({
            name: 'John Smith',
            email: 'john@example.com',
            password: 'password123',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=random'
        });
        console.log(`Created ${3} users.`);
        console.log('Demo credentials: admin@example.com / password123, jane@example.com / password123, john@example.com / password123');

        // 2. Create Posts (for the dashboard feed)
        const posts = await Post.create([
            {
                title: 'React Hooks Patterns for Real Apps',
                content: 'A practical guide to useEffect, useMemo, and useCallback with examples from production apps. Learn how to avoid stale state, reduce re-renders, and structure hooks by intent.',
                author: jane._id,
                category: 'Frontend',
                type: 'tutorial',
                tags: ['react', 'hooks', 'typescript'],
                views: 156,
                likes: [admin._id, john._id],
                comments: [
                    { text: 'Clear explanations and examples — thanks!', user: admin._id }
                ]
            },
            {
                title: 'Debugging Node.js Memory Leaks',
                content: 'If your Node server keeps growing in RAM usage, use heap snapshots and allocation timelines to find the source. This post walks through a step‑by‑step checklist.',
                author: admin._id,
                category: 'Backend',
                type: 'article',
                tags: ['nodejs', 'performance', 'debugging'],
                views: 98,
                likes: [jane._id]
            },
            {
                title: 'Question: Best Monorepo Structure for React + API?',
                content: 'I’m splitting a React front‑end and Express API. Should I use pnpm workspaces or Turborepo? Any gotchas around shared types and deployments?',
                author: john._id,
                category: 'Architecture',
                type: 'question',
                tags: ['monorepo', 'turborepo', 'pnpm'],
                views: 64,
                likes: [admin._id],
                answers: [
                    {
                        content: 'pnpm workspaces is a great default. Keep shared types in a /packages folder and use tsconfig path aliases.',
                        author: admin._id,
                        votes: { up: [jane._id], down: [] }
                    }
                ]
            }
        ]);
        console.log(`Created ${posts.length} posts.`);

        // 3. Create Learning Paths
        await LearningPath.create([
            {
                title: 'Full Stack Hero',
                description: 'Master the MERN stack from zero to hero. Build real-world applications.',
                coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop', // React/Node generic
                author: admin._id,
                difficulty: 'Intermediate',
                tags: ['React', 'Node.js', 'MongoDB', 'Express'],
                modules: [
                    { title: 'Frontend Fundamentals', steps: [{ title: 'React Hooks Deep Dive', post: posts[0]._id, isOptional: false }] },
                    { title: 'Backend Mastery', steps: [{ title: 'Express Middleware', post: posts[1]._id, isOptional: false }, { title: 'Auth with JWT', post: posts[1]._id, isOptional: false }] }
                ],
                isPublished: true,
                enrolledCount: 154
            },
            {
                title: 'AI Engineering 101',
                description: 'Understand LLMs, RAG pipelines, and how to build AI agents.',
                coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop', // AI generic
                author: jane._id,
                difficulty: 'Advanced',
                tags: ['AI', 'Python', 'LangChain'],
                modules: [
                    { title: 'Intro to LLMs', steps: [{ title: 'Transformers Architecture', post: posts[2]._id, isOptional: false }] },
                    { title: 'Vector Databases', steps: [{ title: 'Using Pinecone', post: posts[2]._id, isOptional: false }] }
                ],
                isPublished: true,
                enrolledCount: 89
            },
            {
                title: 'DevOps & Cloud',
                description: 'Learn Docker, Kubernetes, and CI/CD pipelines.',
                coverImage: 'https://images.unsplash.com/photo-1667372393119-c81c0cda0a29?q=80&w=800&auto=format&fit=crop', // Server generic
                author: admin._id,
                difficulty: 'Intermediate',
                tags: ['Docker', 'AWS', 'CI/CD'],
                modules: [],
                isPublished: true,
                enrolledCount: 42
            }
        ]);
        console.log('Created Learning Paths.');

        // 4. Create Projects
        await Project.create([
            {
                title: 'Crypto Dashboard',
                description: 'Real-time cryptocurrency analytics dashboard using CoinGecko API and WebSocket.',
                coverImage: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800&auto=format&fit=crop',
                author: john._id,
                tags: ['React', 'WebSocket', 'FinTech'],
                likes: [admin._id, jane._id],
                views: 342,
                repoLink: 'https://github.com',
                demoLink: 'https://example.com'
            },
            {
                title: 'Social Media App',
                description: 'A Twitter clone built with Next.js and Supabase. Features real-time posts and likes.',
                coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop',
                author: jane._id,
                tags: ['Next.js', 'Supabase', 'Social'],
                likes: [admin._id],
                views: 120,
                repoLink: 'https://github.com',
                demoLink: 'https://example.com'
            },
            {
                title: 'E-commerce Platform',
                description: 'Full-featured e-commerce site with Stripe payment integration.',
                coverImage: 'https://images.unsplash.com/photo-1472851294608-41552241e2cd?q=80&w=800&auto=format&fit=crop',
                author: admin._id,
                tags: ['Stripe', 'Node.js', 'E-commerce'],
                likes: [john._id],
                views: 890,
                isFeatured: true,
                repoLink: 'https://github.com',
                demoLink: 'https://example.com'
            }
        ]);
        console.log('Created Projects.');

        // 5. Create Events
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

        await Event.create([
            {
                title: 'Live Coding: Rust for Beginners',
                description: 'Join us as we build a CLI tool in Rust from scratch.',
                date: tomorrow,
                type: 'Webinar',
                host: admin._id,
                attendees: [jane._id, john._id],
                link: 'https://zoom.us/j/123456'
            },
            {
                title: 'System Design AMA',
                description: 'Ask anything about distributed systems, scaling, and microservices.',
                date: nextWeek,
                type: 'AMA',
                host: jane._id,
                attendees: [admin._id],
                link: 'https://zoom.us/j/789012'
            },
            {
                title: 'React 19 Workshop',
                description: 'Deep dive into the new features of React 19.',
                date: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
                type: 'Workshop',
                host: admin._id,
                attendees: [],
                link: 'https://meet.google.com/abc-defg-hij'
            }
        ]);
        console.log('Created Events.');

        console.log('Database seeded successfully!');

        console.log('Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
