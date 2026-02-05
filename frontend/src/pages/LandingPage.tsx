import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/AppNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookmarkIcon,
    SparklesIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState('For you');

    const feedContent = {
        'For you': [
            {
                author: "Will Larson",
                title: "Writing an Engineering Strategy",
                desc: "Strategies are about tradeoffs. Good strategies make those tradeoffs explicit and help teams move faster by reducing decision paralysis.",
                tag: "Management",
                date: "Dec 4",
                img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop"
            },
            {
                author: "Addy Osmani",
                title: "Image Optimization in 2024",
                desc: "New formats like AVIF, proper sizing attributes, and lazy loading strategies can cut your LCP in half.",
                tag: "Performance",
                date: "Dec 3",
                img: "https://images.unsplash.com/photo-1550439062-609e1531270e?w=400&h=300&fit=crop"
            },
            {
                author: "Kent C. Dodds",
                title: "Full Stack Components",
                desc: "The lines between client and server are blurring. Here is how to think about component composition in a RSC world.",
                tag: "React",
                date: "Dec 1",
                img: "https://images.unsplash.com/photo-1633356122102-3fe601e15fae?w=400&h=300&fit=crop"
            },
            {
                author: "Josh Comeau",
                title: "Designing Beautiful Shadows",
                desc: "Shadows add depth and hierarchy. But default browser shadows are messy. Let's create lush, realistic shadows with CSS.",
                tag: "Design",
                date: "Nov 28",
                img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&h=300&fit=crop"
            }
        ],
        'Technology': [
            {
                author: "Tech Crunch",
                title: "The Rise of Quantum Computing",
                desc: "Quantum supremacy is closer than we think. Here's a look at the latest breakthroughs from IBM and Google.",
                tag: "Future Tech",
                date: "Dec 10",
                img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop"
            },
            {
                author: "Verge Science",
                title: "AI in Healthcare: A Revolution",
                desc: "From diagnosing rare diseases to personalized medicine, artificial intelligence is reshaping the medical landscape.",
                tag: "AI",
                date: "Dec 9",
                img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop"
            },
            {
                author: "Wired",
                title: "Cybersecurity in 2024",
                desc: "As threats evolve, so must our defenses. Zero trust architecture is becoming the new standard.",
                tag: "Security",
                date: "Dec 8",
                img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop"
            }
        ],
        'Design': [
            {
                author: "Smashing Mag",
                title: "Typography Trends for 2025",
                desc: "Serifs are back, neon colors are out. A look at what's defining the visual language of the web next year.",
                tag: "Typography",
                date: "Dec 11",
                img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop"
            },
            {
                author: "A List Apart",
                title: "Accessible Color Palettes",
                desc: "Designing for everyone means ensuring high contrast and readable combinations. Use these tools to verify your designs.",
                tag: "Accessibility",
                date: "Dec 7",
                img: "https://images.unsplash.com/photo-1586717791821-3f44a5638d28?w=400&h=300&fit=crop"
            },
            {
                author: "UX Collective",
                title: "The Psychology of Dark Mode",
                desc: "Why do users prefer dark interfaces? It's not just about battery life; it's about focus and visual comfort.",
                tag: "UX",
                date: "Dec 6",
                img: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=400&h=300&fit=crop"
            }
        ],
        'Productivity': [
            {
                author: "James Clear",
                title: "Atomic Habits for Developers",
                desc: "Small changes in your coding workflow can lead to massive improvements in output and code quality over time.",
                tag: "Habits",
                date: "Dec 12",
                img: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop"
            },
            {
                author: "Tim Ferriss",
                title: "Deep Work vs. Shallow Work",
                desc: "How to carve out 4-hour blocks of uninterrupted time in a world of constant notifications and Slack pings.",
                tag: "Focus",
                date: "Dec 5",
                img: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=300&fit=crop"
            }
        ]
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-white font-serif text-slate-900 selection:bg-yellow-200 selection:text-black">
            <Navbar forceWhite={true} />

            {/* Hero Section - Modern Engineering / Linear Style */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Animated Gradient Mesh Background */}
                <div className="absolute inset-0 gradient-mesh-subtle" />

                {/* Floating Orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-violet-500/20 rounded-full blur-[140px] animate-float" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-full blur-[140px] animate-float" style={{ animationDelay: '3s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/15 to-pink-500/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '6s' }} />
                </div>

                {/* Technical Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        {/* Pill Badge */}


                        <h1 className="text-6xl md:text-8xl font-sans font-extrabold tracking-tight leading-tight animate-fade-in-scale">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">Knowledge </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 animate-shimmer">
                                Evolved.
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-600 font-sans font-normal leading-relaxed max-w-2xl mx-auto">
                            The collaborative platform where engineering teams share context, document decisions, and scale their culture.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-lg font-sans font-bold hover:shadow-2xl hover:shadow-slate-500/30 hover:-translate-y-1 active:scale-95 transition-all relative overflow-hidden group">
                                <span className="relative z-10">Start for free</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </Link>
                        </div>
                    </motion.div>


                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                {/* Trending Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-3 mb-6 font-sans text-xs font-bold uppercase tracking-widest text-slate-700">
                        <span className="p-1 rounded-full border border-slate-700">
                            <ArrowTrendingUpIcon className="w-4 h-4" />
                        </span>
                        Trending on Knowledge
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 border-b border-slate-200 pb-16">
                        {[
                            { num: "01", title: "The End of Front-End Deployment?", author: "Sarah Drasner", date: "Oct 24", time: "5 min read", img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop" },
                            { num: "02", title: "Why I'm leaving Microservices", author: "DHH", date: "Oct 22", time: "8 min read", img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" },
                            { num: "03", title: "React Server Components: A deep dive", author: "Dan Abramov", date: "Oct 20", time: "12 min read", img: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop" },
                            { num: "04", title: "Understanding AI Agents", author: "Andrej Karpathy", date: "Oct 19", time: "6 min read", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop" },
                            { num: "05", title: "CSS Container Queries are here", author: "Una Kravets", date: "Oct 18", time: "4 min read", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
                            { num: "06", title: "Mastering TypeScript Generics", author: "Matt Pocock", date: "Oct 16", time: "9 min read", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
                        ].map((item) => (
                            <div key={item.num} className="flex gap-4 items-start group cursor-pointer">
                                <span className="text-3xl font-bold text-slate-200 font-sans -mt-2 selection:bg-transparent">{item.num}</span>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold font-sans text-slate-700">
                                        <img src={item.img} className="w-5 h-5 rounded-full object-cover" alt={item.author} />
                                        {item.author}
                                    </div>
                                    <h3 className="text-base font-bold font-sans text-slate-900 leading-snug group-hover:underline decoration-slate-900 decoration-1 underline-offset-2">
                                        {item.title}
                                    </h3>
                                    <div className="text-xs text-slate-500 font-sans">
                                        {item.date} · {item.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 pb-24">
                    {/* Left Feed - Professional Articles */}
                    <div className="space-y-12">
                        {/* Tabs Navigation */}
                        <div className="border-b border-slate-200 flex gap-8 mb-8 overflow-x-auto no-scrollbar">
                            {Object.keys(feedContent).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-4 text-sm font-bold font-sans uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeTab === tab
                                        ? 'border-slate-900 text-slate-900'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Featured Article - Dynamic based on tab? Or keep static featured and just switch list? 
                            Let's keep the main Editor's Choice as a "Global" feature for now, or randomize it. 
                            I'll leave the editor's choice as static to anchor the page, and the tabs control the feed below.
                         */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="group cursor-pointer mb-16"
                        >
                            <div className="w-full aspect-[16/9] bg-slate-100 rounded-lg overflow-hidden mb-6 relative">
                                <img
                                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    alt="Featured"
                                />
                                <div className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-sans font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Editor's Choice
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-sans font-medium text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 bg-cover bg-center" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=12)' }}></div>
                                    <span>Elena Fisher</span>
                                    <span className="text-slate-400">·</span>
                                    <span>Dec 12</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 leading-tight group-hover:text-cyan-700 transition-colors">
                                    The Future of Distributed Systems: Beyond Microservices
                                </h3>
                                <p className="font-serif text-lg text-slate-600 leading-relaxed max-w-2xl">
                                    As infrastructure complexity grows, we need to rethink our approach to modularity. It's not just about splitting services anymore; it's about intelligent orchestration and data locality.
                                </p>
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {['Architecture', 'Backend', 'System Design'].map(tag => (
                                        <span key={tag} className="text-xs font-sans border border-slate-200 px-2 py-1 rounded text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Article List - Dynamic */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-12"
                            >
                                {feedContent[activeTab as keyof typeof feedContent].map((post, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col md:flex-row gap-8 items-start justify-between cursor-pointer group border-b border-slate-100 pb-12 last:border-0"
                                    >
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-2 text-xs font-sans font-medium text-slate-700">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 bg-center bg-cover" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10 + (Object.keys(feedContent).indexOf(activeTab) * 5)})` }}></div>
                                                {post.author}
                                            </div>
                                            <h2 className="text-xl md:text-2xl font-bold font-sans text-slate-900 leading-tight group-hover:text-cyan-700 transition-colors">
                                                {post.title}
                                            </h2>
                                            <p className="font-serif text-slate-500 line-clamp-3 leading-relaxed text-base md:text-[1.05rem]">
                                                {post.desc}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs font-sans text-slate-500 pt-3">
                                                <span className="bg-slate-50 px-3 py-1 rounded text-slate-600 font-medium hover:bg-slate-200 transition-colors">{post.tag}</span>
                                                <span>4 min read</span>
                                                <span>·</span>
                                                <span>{post.date}</span>
                                                <div className="ml-auto flex gap-3">
                                                    <BookmarkIcon className="w-5 h-5 text-slate-400 hover:text-slate-900 transition-colors" />
                                                    <SparklesIcon className="w-5 h-5 text-slate-400 hover:text-yellow-600 transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-32 lg:w-40 aspect-[4/3] bg-slate-100 flex-shrink-0 rounded-sm overflow-hidden">
                                            <img
                                                src={post.img}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                alt={post.title}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Sidebar (Sticky) */}
                    <div className="hidden lg:block">
                        <div className="sticky top-28 space-y-12">
                            <div>
                                <h4 className="text-sm font-bold font-sans text-slate-900 uppercase tracking-widest mb-4">Discover more</h4>
                                <div className="flex flex-wrap gap-2 text-sm font-sans">
                                    {['Programming', 'Data Science', 'Technology', 'Self Improvement', 'Writing', 'Machine Learning', 'Productivity', 'Politics', 'Crypto'].map(tag => (
                                        <Link key={tag} to={`/search?q=${tag}`} className="px-4 py-2 border border-slate-200 rounded-sm text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-colors bg-white">
                                            {tag}
                                        </Link>
                                    ))}
                                </div>
                                <Link to="/tags" className="text-sm font-sans text-green-600 hover:text-green-700 mt-4 inline-block font-medium">See all topics</Link>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <h4 className="text-sm font-bold font-sans text-slate-900 uppercase tracking-widest mb-4">Recommended Users</h4>
                                <div className="space-y-5">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 40})` }}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold font-sans text-slate-900 truncate">Engineering Team</div>
                                                <p className="text-xs font-serif text-slate-500 line-clamp-1">Sharing the best practices for scaling...</p>
                                            </div>
                                            <button className="text-xs border border-slate-900 rounded-full px-3 py-1.5 font-sans font-medium hover:bg-black hover:text-white transition-all">Follow</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-xs font-sans text-slate-400 border-t border-slate-100 pt-8 leading-loose">
                                <Link to="#" className="hover:text-slate-600 text-slate-500 mr-4">Help</Link>
                                <Link to="#" className="hover:text-slate-600 text-slate-500 mr-4">Status</Link>
                                <Link to="#" className="hover:text-slate-600 text-slate-500 mr-4">Writers</Link>
                                <Link to="#" className="hover:text-slate-600 text-slate-500 mr-4">Blog</Link>
                                <Link to="#" className="hover:text-slate-600 text-slate-500 mr-4">Careers</Link>
                                <Link to="#" className="hover:text-slate-600 text-slate-500 mr-4">Privacy</Link>
                                <Link to="#" className="hover:text-slate-600 text-slate-500">Terms</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
