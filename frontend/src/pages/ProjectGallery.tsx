import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/AppNavbar';

interface Project {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    tags: string[];
    author: {
        name: string;
        avatar: string;
    };
    views: number;
    likes: string[];
    createdAt: string;
}

const ProjectGallery = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'newest' | 'oldest'

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');
                setProjects(res.data);
                setFilteredProjects(res.data);
            } catch (err) {
                console.error('Error fetching projects:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Filter & Sort Logic
    useEffect(() => {
        let result = [...projects];

        // 1. Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Filter (Category/Tags - simulating categories via tags for now)
        if (activeFilter !== 'All') {
            result = result.filter(p => p.tags.some(tag => tag.toLowerCase().includes(activeFilter.toLowerCase())));
        }

        // 3. Sort
        if (sortBy === 'popular') {
            result.sort((a, b) => b.likes.length - a.likes.length || b.views - a.views);
        } else if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        setFilteredProjects(result);
    }, [projects, searchQuery, activeFilter, sortBy]);

    const filters = ['All', 'Web', 'Mobile', 'AI', 'Game', 'Tool'];

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-pink-200 selection:text-slate-900">
            <Navbar forceWhite={true} />

            {/* Hero Section */}
            <div className="relative bg-slate-100 pt-32 pb-24 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-white opacity-95"></div>
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight"
                    >
                        Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Showcase</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed"
                    >
                        Explore the cutting edge of what our community is building. Open source, experimental, and inspiring.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <Link
                            to="/submit-project"
                            className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-900 font-bold rounded-full overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105"
                        >
                            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-indigo-50 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                            <span className="relative flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Submit Your Project
                            </span>
                        </Link>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
                {/* Controls */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-2 rounded-2xl shadow-xl mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filters */}
                    <div className="flex p-1 overflow-x-auto gap-1 no-scrollbar">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeFilter === filter
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/60'
                                    : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Search & Sort */}
                    <div className="flex flex-col sm:flex-row gap-2 p-1">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none w-full pl-4 pr-10 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="popular">Popular</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                            <svg className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {filteredProjects.map((project, index) => (
                                <motion.div
                                    key={project._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Link to={`/projects/${project._id}`} className="group block h-full bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
                                        <div className="h-56 bg-slate-100 relative overflow-hidden">
                                            {project.coverImage ? (
                                                <img
                                                    src={project.coverImage}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                                                    <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Preview</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                                            <div className="absolute top-4 right-4 z-10">
                                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                                    View Project
                                                </div>
                                            </div>

                                            <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end">
                                                <div className="flex -space-x-2">
                                                    {/* Mock contributors for visual flair if needed, using author for now */}
                                                    <img src={project.author.avatar || `https://ui-avatars.com/api/?name=${project.author.name}`} alt="" className="w-8 h-8 rounded-full border-2 border-white bg-white" title={project.author.name} />
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-md rounded-lg px-2 py-1 text-white text-xs font-bold flex items-center">
                                                    <svg className="w-3 h-3 mr-1 text-pink-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                                    {project.likes.length}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {project.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight mb-2">
                                                    {project.title}
                                                </h3>
                                                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{project.description}</p>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    {project.views}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && filteredProjects.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm"
                    >
                        <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No projects found</h3>
                        <p className="max-w-md mx-auto text-slate-500 mb-8">We couldn't find any projects matching your search. Try different keywords or clear your filters.</p>
                        <button
                            onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/60"
                        >
                            Reset Search
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ProjectGallery;
