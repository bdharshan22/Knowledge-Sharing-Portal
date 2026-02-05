import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/AppNavbar';
import { motion } from 'framer-motion';

interface LearningPath {
    _id: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    tags: string[];
    author: { name: string };
    modules: { steps: any[] }[];
    enrolledCount?: number;
}

const LearningPaths = () => {
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [filteredPaths, setFilteredPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('All');

    useEffect(() => {
        const fetchPaths = async () => {
            try {
                const res = await api.get('/learning-paths');
                setPaths(res.data);
                setFilteredPaths(res.data);
            } catch (err) {
                console.error('Error fetching paths:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPaths();
    }, []);

    useEffect(() => {
        let result = paths;
        if (searchQuery) {
            result = result.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedLevel !== 'All') {
            result = result.filter(p => p.difficulty === selectedLevel);
        }
        setFilteredPaths(result);
    }, [searchQuery, selectedLevel, paths]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar forceWhite={true} />

            {/* Hero Section */}
            <div className="relative bg-slate-100 pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-slate-100 opacity-95"></div>
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-sm font-semibold mb-4 backdrop-blur-sm">
                            Curated Roadmaps
                        </span>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Craft</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Structured learning paths designed by experts to take you from beginner to pro.
                        </p>
                    </motion.div>

                    {/* Search & Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md border border-slate-200 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-xl"
                    >
                        <div className="relative flex-1">
                            <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Find a skill (e.g., React, Python)..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 text-slate-700">
                            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedLevel(level)}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${selectedLevel === level
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200/60'
                                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* List Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPaths.map((path, index) => (
                            <motion.div
                                key={path._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={`/learning-paths/${path._id}`} className="group block h-full bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
                                    <div className="h-52 relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 opacity-100 group-hover:opacity-90 ${path.difficulty === 'Beginner' ? 'from-emerald-400 to-teal-600' :
                                            path.difficulty === 'Intermediate' ? 'from-indigo-400 to-purple-600' :
                                                'from-orange-400 to-pink-600'
                                            }`}></div>

                                        {/* Decorative pattern */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>

                                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                            <div className="flex justify-between items-end">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-white/20 backdrop-blur-md border-white/20 text-white`}>
                                                    {path.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-display font-bold text-white mt-3 group-hover:underline decoration-2 underline-offset-4 shadow-black drop-shadow-md">
                                                {path.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col bg-white">
                                        <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed flex-1">
                                            {path.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {path.tags?.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    #{tag}
                                                </span>
                                            ))}
                                            {(path.tags?.length || 0) > 3 && (
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg">
                                                    +{(path.tags?.length || 0) - 3}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                            <div className="flex items-center text-slate-500 text-sm font-medium">
                                                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                {path.modules?.reduce((acc, module) => acc + (module.steps?.length || 0), 0) || 0} Steps
                                            </div>

                                            {path.enrolledCount !== undefined && path.enrolledCount > 0 && (
                                                <div className="flex items-center text-slate-500 text-sm font-medium">
                                                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                    {path.enrolledCount} Students
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && filteredPaths.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No paths found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            We couldn't find any learning paths matching your search. Try adjusting your filters.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedLevel('All'); }}
                            className="mt-6 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default LearningPaths;
