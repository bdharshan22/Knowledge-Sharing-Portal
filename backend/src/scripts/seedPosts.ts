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
            // Articles
            {
                title: 'Getting Started with React 19',
                content: 'React 19 brings exciting new features like the `use` hook, Actions, and enhanced Server Components support. In this guide, we explore how to migrate your existing app and take advantage of these performance improvements.',
                author: userA._id,
                category: 'Frontend',
                type: 'article',
                tags: ['react', 'javascript', 'frontend'],
                difficulty: 'Beginner',
                views: 1250,
                likes: [userB._id, userC._id],
                comments: [{ text: 'Great overview! The new compiler looks promising.', user: userB._id }]
            },
            {
                title: 'System Design: Scaling to 1 Million Users',
                content: 'Scaling a system requires a deep understanding of load balancing, caching strategies (Redis/Memcached), database sharding, and asynchronous processing with message queues. Here is a blueprint for high availability.',
                author: userC._id,
                category: 'Backend',
                type: 'article',
                tags: ['system-design', 'scalability', 'architecture'],
                difficulty: 'Advanced',
                views: 3400,
                likes: [userA._id, userB._id],
                comments: [{ text: 'This helped me ace my interview!', user: userA._id }]
            },
            {
                title: 'Mastering TypeScript Generics',
                content: 'Generics allow you to write reusable, type-safe code. We cover constraints, default types, and utility types like Partial, Pick, and Omit to level up your TS skills.',
                author: userB._id,
                category: 'Languages',
                type: 'article',
                tags: ['typescript', 'coding', 'tutorial'],
                difficulty: 'Intermediate',
                views: 890,
                likes: [userC._id]
            },
            {
                title: 'The Future of AI Agents',
                content: 'Autonomous agents are the next frontier in AI. From AutoGPT to custom LangChain implementations, learn how agents are changing the way we automate workflows.',
                author: userA._id,
                category: 'AI/ML',
                type: 'article',
                tags: ['ai', 'agents', 'future-tech'],
                difficulty: 'Intermediate',
                views: 2100,
                likes: [userB._id]
            },
            // Questions
            {
                title: 'Question: How to fix CORS errors in production?',
                content: 'I am getting "Access-Control-Allow-Origin" errors when my frontend calls my backend. I have configured `cors` in Express but it still fails. Help?',
                author: userB._id,
                category: 'Backend',
                type: 'question',
                tags: ['cors', 'express', 'error-handling'],
                difficulty: 'Beginner',
                views: 450,
                likes: [userC._id],
                answers: [
                    {
                        content: 'Make sure your `origin` in the CORS config matches your frontend URL exactly (no trailing slash). Also check if you are sending credentials/cookies.',
                        author: userC._id,
                        votes: { up: [userA._id], down: [] }
                    }
                ]
            },
            {
                title: 'Question: Best way to handle global state in 2024?',
                content: 'Redux, Zustand, Recoil, or just Context API? I am starting a mid-sized dashboard app and confused about the choices.',
                author: userA._id,
                category: 'Frontend',
                type: 'question',
                tags: ['state-management', 'react', 'discussion'],
                difficulty: 'Intermediate',
                views: 670,
                likes: [userB._id],
                answers: [
                    {
                        content: 'Zustand is very popular right now for its simplicity and small bundle size. Use Context for static data (theme, auth) and Zustand for complex UI state.',
                        author: userB._id,
                        votes: { up: [userC._id], down: [] }
                    }
                ]
            },
            {
                title: 'Question: Docker vs Kubernetes for small projects?',
                content: 'I have a simple MERN stack app. Is it worth learning Kubernetes or should I just stick to Docker Compose or a PAAS like Render?',
                author: userC._id,
                category: 'DevOps',
                type: 'question',
                tags: ['docker', 'kubernetes', 'devops'],
                difficulty: 'Beginner',
                views: 320,
                likes: [userA._id],
                answers: [
                    {
                        content: 'For small projects, K8s is overkill. Stick to Render/Vercel or Docker Compose on a VPS. It reduces maintenance overhead significantly.',
                        author: userA._id,
                        votes: { up: [userB._id], down: [] }
                    }
                ]
            },
            // New Content
            {
                title: 'Modern CSS: Container Queries & :has()',
                content: 'CSS has evolved significantly. Container queries allow components to adapt to their parent container, not just the viewport. The :has() pseudo-class (parent selector) finally solves complex layout challenges without JS.',
                author: userB._id,
                category: 'Frontend',
                type: 'article',
                tags: ['css', 'web-design', 'responsive'],
                difficulty: 'Intermediate',
                views: 540,
                likes: [userA._id, userC._id]
            },
            {
                title: 'Microservices vs Monolith: When to Split?',
                content: 'Don’t start with microservices. Start with a refined monolith. Split only when organizational scaling (independent teams) or distinct scaling profiles (CPU vs I/O bound modules) demand it.',
                author: userC._id,
                category: 'Architecture',
                type: 'article',
                tags: ['microservices', 'system-design', 'backend'],
                difficulty: 'Advanced',
                views: 2800,
                likes: [userA._id, userB._id]
            },
            {
                title: 'Question: How to handle JWT token expiration gracefully?',
                content: 'My users get logged out abruptly when the token expires. How do I implement silent refresh with Axios interceptors?',
                author: userA._id,
                category: 'Security',
                type: 'question',
                tags: ['jwt', 'auth', 'axios'],
                difficulty: 'Intermediate',
                views: 890,
                likes: [userB._id],
                answers: [
                    {
                        content: 'Store a refresh token in an HttpOnly cookie. In your axios response interceptor, catch 401s, call /refresh-token, update the header, and retry the original request.',
                        author: userC._id,
                        votes: { up: [userB._id], down: [] }
                    }
                ]
            },
            {
                title: '10 Essential VS Code Extensions for 2024',
                content: 'Boost your productivity with these extensions: 1. Console Ninja (inline logs), 2. Pretty TypeScript Errors, 3. Tailwind CSS IntelliSense, 4. GitLens, 5. Error Lens. What are your favorites?',
                author: userB._id,
                category: 'Tools',
                type: 'resource',
                tags: ['vscode', 'productivity', 'tools'],
                difficulty: 'Beginner',
                views: 4100,
                likes: [userA._id, userC._id]
            },
            {
                title: 'Understanding Database Indexing',
                content: 'A B-Tree index speeds up reads but slows down writes. Learn when to use compound indexes, how verify cardinality, and why "Select *" kills performance.',
                author: userC._id,
                category: 'Database',
                type: 'tutorial',
                tags: ['database', 'sql', 'mongodb', 'performance'],
                difficulty: 'Intermediate',
                views: 1100,
                likes: [userA._id]
            },
            {
                title: 'Question: Career Path - Manager vs Individual Contributor?',
                content: 'I have been a Senior Dev for 2 years. I am being offered a Team Lead role. I am worried I will code less. Is the switch worth it?',
                author: userA._id,
                category: 'Career',
                type: 'discussion',
                tags: ['career', 'management', 'engineering'],
                difficulty: 'Intermediate',
                views: 2200,
                likes: [userB._id, userC._id],
                answers: [
                    {
                        content: 'It is a pendulum. You can try management and switch back to IC (Staff Engineer) later. The skills you learn in people management make you a better engineer.',
                        author: userB._id,
                        votes: { up: [userC._id], down: [] }
                    }
                ]
            },
            {
                title: 'Introduction to GraphQL with Apollo',
                content: 'GraphQL prevents over-fetching. We will build a simple server with Apollo and connect it to a React frontend using valid queries.',
                author: userB._id,
                category: 'Backend',
                type: 'tutorial',
                tags: ['graphql', 'apollo', 'api'],
                difficulty: 'Beginner',
                views: 650,
                likes: [userA._id]
            },
            {
                title: 'Question: Best practices for React Performance?',
                content: 'My app feels sluggish on mobile. I have used React.memo everywhere but it is not helping. What should I profile first?',
                author: userC._id,
                category: 'Frontend',
                type: 'question',
                tags: ['react', 'performance', 'mobile'],
                difficulty: 'Advanced',
                views: 340,
                likes: [userB._id],
                answers: [
                    {
                        content: 'Check your bundle size first. Are you lazy loading routes? Then check for large lists - use virtualization (react-window). "Memo everywhere" can actually hurt if props change often.',
                        author: userA._id,
                        votes: { up: [userB._id], down: [] }
                    }
                ]
            },
            {
                title: 'The Rise of Serverless logic',
                content: 'Serverless functions (Lambda, Vercel Functions) allow you to ship backend logic without managing servers. Perfect for event-driven architectures and webhooks.',
                author: userA._id,
                category: 'Cloud',
                type: 'article',
                tags: ['serverless', 'aws', 'cloud'],
                difficulty: 'Intermediate',
                views: 1500,
                likes: [userC._id]
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
