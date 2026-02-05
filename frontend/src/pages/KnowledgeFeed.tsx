import { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/AppNavbar';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface Post {
    _id: string;
    title: string;
    content: string; // Kept for type compatibility, though API might omit
    excerpt?: string;
    author: { _id: string, name: string, avatar: string };
    createdAt: string;
    likes: string[];
    bookmarks?: string[];
    comments: any[];
    type: 'question' | 'article' | 'resource';
    tags?: string[];
    views?: number;
    feedReasons?: string[];
    isFollowingAuthor?: boolean;
}

const KnowledgeFeed = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'question', 'article'
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'popular', 'trending'
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Load filter preferences from localStorage
    useEffect(() => {
        const savedFilters = localStorage.getItem('ksp_filter_preferences');
        if (savedFilters) {
            try {
                const parsed = JSON.parse(savedFilters);
                setSelectedCategories(parsed.categories || []);
                setSelectedDifficulties(parsed.difficulties || []);
                setSelectedTypes(parsed.types || []);
                setSortBy(parsed.sortBy || 'newest');
            } catch (error) {
                console.error('Failed to parse filter preferences', error);
            }
        }
    }, []);

    // Save filter preferences to localStorage
    useEffect(() => {
        const preferences = {
            categories: selectedCategories,
            difficulties: selectedDifficulties,
            types: selectedTypes,
            sortBy
        };
        localStorage.setItem('ksp_filter_preferences', JSON.stringify(preferences));
    }, [selectedCategories, selectedDifficulties, selectedTypes, sortBy]);

    useEffect(() => {
        const cacheKey = 'ksp_feed_cache_v1';
        const cacheTtlMs = 1000 * 60 * 5;

        // Clear cache if coming from create post (check navigation state)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('refresh') === 'true') {
            sessionStorage.removeItem(cacheKey);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }

        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed?.data) && Date.now() - parsed.ts < cacheTtlMs) {
                    setPosts(parsed.data);
                    setLoading(false);
                }
            } catch {
                // ignore cache parse errors
            }
        }

        const fetchPosts = async () => {
            try {
                // Try personalized feed first
                const res = await api.get('/posts/feed');
                let next = res.data;

                // If feed is empty, fall back to regular posts
                if (!Array.isArray(next) || next.length === 0) {
                    console.log('Feed empty, falling back to regular posts');
                    const fallbackRes = await api.get('/posts');
                    next = fallbackRes.data;
                }

                setPosts(Array.isArray(next) ? next : []);
                sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: next }));
            } catch (err) {
                console.error('Error fetching posts:', err);
                // Try fallback to regular posts on error
                try {
                    const fallbackRes = await api.get('/posts');
                    setPosts(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
                } catch (fallbackErr) {
                    console.error('Fallback also failed:', fallbackErr);
                    setPosts([]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const handleLike = async (postId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.put(`/posts/${postId}/like`);
            setPosts(prev =>
                prev.map(post =>
                    post._id === postId ? { ...post, likes: data } : post
                )
            );
        } catch (err) {
            console.error('Error liking post:', err);
            // toast.error('Failed to like post'); // Keeping this silent as per instruction
        }
    };

    const handleSave = async (postId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.put(`/posts/${postId}/bookmark`);

            // Determine if bookmarked from data or toggle logic if data doesn't return it directly
            // Usually API returns the updated user or post status. Assuming data.isBookmarked or similar.
            const isBookmarked = data.isBookmarked;

            setPosts(prev =>
                prev.map(post => {
                    if (post._id !== postId) return post;
                    const currentBookmarks = post.bookmarks || [];
                    const nextBookmarks = isBookmarked
                        ? [...currentBookmarks, user._id]
                        : currentBookmarks.filter((id) => id !== user._id);
                    return { ...post, bookmarks: nextBookmarks };
                })
            );
            toast.success(isBookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
        } catch (err) {
            console.error('Error saving post:', err);
            toast.error('Failed to update bookmark');
        }
    };

    const handleDelete = async (postId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        const confirmed = window.confirm('Delete this post? This cannot be undone.');
        if (!confirmed) return;

        try {
            await api.delete(`/posts/${postId}`);
            setPosts(prev => prev.filter(post => post._id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const handleFollow = async (authorId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.put(`/users/${authorId}/follow`);
            const isFollowing = data?.isFollowing;
            setPosts(prev =>
                prev.map(post =>
                    post.author?._id === authorId
                        ? { ...post, isFollowingAuthor: isFollowing }
                        : post
                )
            );
        } catch (err) {
            console.error('Error toggling follow:', err);
        }
    };

    // Extract all unique tags from posts
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        posts.forEach(post => {
            post.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet);
    }, [posts]);

    // Apply comprehensive filtering
    const filteredPosts = useMemo(() => {
        let result = [...posts];

        // Basic type filter (legacy)
        if (filter !== 'all') {
            result = result.filter(p => p.type === filter);
        }

        // Advanced filters
        if (selectedTypes.length > 0) {
            result = result.filter(p => selectedTypes.includes(p.type));
        }

        if (selectedTags.length > 0) {
            result = result.filter(p =>
                p.tags?.some(tag => selectedTags.includes(tag))
            );
        }

        // Sort
        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'popular') {
            result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (sortBy === 'trending') {
            // Trending = combination of recent + popular
            result.sort((a, b) => {
                const aScore = (a.likes?.length || 0) + (a.views || 0) * 0.1;
                const bScore = (b.likes?.length || 0) + (b.views || 0) * 0.1;
                const aRecency = Date.now() - new Date(a.createdAt).getTime();
                const bRecency = Date.now() - new Date(b.createdAt).getTime();
                return (bScore / (bRecency / 86400000 + 1)) - (aScore / (aRecency / 86400000 + 1));
            });
        }

        return result;
    }, [posts, filter, selectedTypes, selectedTags, sortBy]);

    const stats = useMemo(() => {
        const total = posts.length;
        const questions = posts.filter(p => p.type === 'question').length;
        const articles = posts.filter(p => p.type === 'article').length;
        const recent = posts.filter(p => {
            const created = new Date(p.createdAt).getTime();
            return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
        }).length;
        return { total, questions, articles, recent };
    }, [posts]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    };

    const toggleFilter = (filterArray: string[], setFilterArray: (arr: string[]) => void, value: string) => {
        if (filterArray.includes(value)) {
            setFilterArray(filterArray.filter(v => v !== value));
        } else {
            setFilterArray([...filterArray, value]);
        }
    };

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedDifficulties([]);
        setSelectedTypes([]);
        setSelectedTags([]);
        setSortBy('newest');
        setFilter('all');
    };

    const activeFilterCount = selectedCategories.length + selectedDifficulties.length + selectedTypes.length + selectedTags.length + (filter !== 'all' ? 1 : 0);

    return (
        <div className="min-h-screen relative pb-20">
            <Navbar />

            {/* Animated Gradient Mesh Background */}
            <div className="fixed inset-0 gradient-mesh-subtle z-0" />

            {/* Floating Orbs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full blur-[140px] animate-float"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-300/40 to-blue-300/40 rounded-full blur-[140px] animate-float" style={{ animationDelay: '3s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-emerald-300/30 to-teal-300/30 rounded-full blur-[120px] animate-float" style={{ animationDelay: '6s' }}></div>
            </div>

            <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 pt-28">
                {/* Dashboard Header */}
                <div className="mb-10 space-y-6 animate-fade-in-scale">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">Dashboard</div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 mt-2">
                                Welcome back{user?.name ? `, ${user.name}` : ''}
                            </h1>
                            <p className="text-slate-600 mt-2 text-lg">Catch up on new knowledge and keep your momentum going.</p>

                            {/* Personalization Hint */}
                            {!user?.skills?.length && (
                                <div className="mt-4 p-4 glass-card border-2 border-blue-200/50 flex items-center gap-3 animate-slide-up hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <span className="text-3xl animate-glow">💡</span>
                                    <div>
                                        <p className="text-sm text-blue-800 font-semibold">Your feed looks generic because you haven't set your interests yet.</p>
                                        <Link to="/settings/profile" className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold inline-flex items-center gap-1 mt-1">
                                            Update Profile & Skills
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link to="/create-post" className="btn-primary px-6 py-3 text-sm shadow-2xl shadow-cyan-300/50 hover:shadow-cyan-400/60 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Create Post
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </Link>
                            <Link to="/collections" className="btn-secondary px-5 py-3 text-sm hover:shadow-xl">
                                Collections
                            </Link>
                            <Link to="/bookmarks" className="btn-secondary px-5 py-3 text-sm hover:shadow-xl">
                                Bookmarks
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-premium p-5 card-hover group">
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Feed Items</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-blue-600 transition-all duration-300">{stats.total}</div>
                            <div className="mt-2 h-1 w-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full group-hover:w-full transition-all duration-500" />
                        </div>
                        <div className="glass-premium p-5 card-hover group">
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Questions</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300">{stats.questions}</div>
                            <div className="mt-2 h-1 w-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full group-hover:w-full transition-all duration-500" />
                        </div>
                        <div className="glass-premium p-5 card-hover group">
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Articles</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">{stats.articles}</div>
                            <div className="mt-2 h-1 w-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:w-full transition-all duration-500" />
                        </div>
                        <div className="glass-premium p-5 card-hover group">
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">New This Week</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300">{stats.recent}</div>
                            <div className="mt-2 h-1 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full group-hover:w-full transition-all duration-500" />
                        </div>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="glass-premium p-5 flex flex-col md:flex-row gap-4 md:items-center hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
                        <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-500 mb-2">Search</div>
                            <div className="relative">
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search posts, tags, or people..."
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 pl-10 text-slate-900 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500/50 focus:bg-white transition-all duration-300"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary px-8 py-3 text-sm shadow-xl shadow-cyan-300/40 hover:shadow-cyan-400/50 relative overflow-hidden group">
                            <span className="relative z-10">Find</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </button>
                    </form>

                    {/* Advanced Filters Panel */}
                    <div className="glass-premium p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 text-sm uppercase tracking-wider">
                                    Filters
                                </h3>
                                {activeFilterCount > 0 && (
                                    <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-xs text-slate-600 hover:text-red-600 font-medium transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Active Filter Chips */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedTypes.map(type => (
                                    <motion.span
                                        key={type}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full flex items-center gap-2"
                                    >
                                        {type}
                                        <button onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </motion.span>
                                ))}
                                {selectedTags.map(tag => (
                                    <motion.span
                                        key={tag}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-2"
                                    >
                                        #{tag}
                                        <button onClick={() => toggleFilter(selectedTags, setSelectedTags, tag)}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </motion.span>
                                ))}
                            </div>
                        )}

                        {/* Collapsible Filter Options */}
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-6"
                            >
                                {/* Sort Options */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Sort By</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['newest', 'popular', 'trending'].map(option => (
                                            <button
                                                key={option}
                                                onClick={() => setSortBy(option)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${sortBy === option
                                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                    }`}
                                            >
                                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Post Type Filters */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Post Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['article', 'question', 'resource'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedTypes.includes(type)
                                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                    }`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tag Cloud */}
                                {allTags.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                            Popular Tags ({allTags.length})
                                        </label>
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                            {allTags.slice(0, 20).map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => toggleFilter(selectedTags, setSelectedTags, tag)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTags.includes(tag)
                                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    #{tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] xl:grid-cols-[280px_minmax(0,1fr)_320px] gap-8 lg:gap-10 items-start">

                    {/* Left Sidebar (Navigation/Filter) */}
                    <div className="lg:col-start-1 hidden lg:block space-y-6 sticky top-28 h-fit">
                        <div className="glass-card p-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <img
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=e2e8f0&color=0f172a`}
                                    className="w-12 h-12 rounded-full border-2 border-slate-200"
                                />
                                <div>
                                    <div className="font-bold text-slate-900">{user?.name}</div>
                                    <div className="text-xs text-slate-600">Full Stack Developer</div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Link to="/dashboard" className="flex items-center justify-between px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm border border-indigo-200">
                                    <div className="flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                        </svg>
                                        <span>My Feed</span>
                                    </div>
                                    <span className="bg-indigo-200 text-indigo-700 text-xs px-2 py-0.5 rounded-full">12</span>
                                </Link>
                                <Link to="/bookmarks" className="flex items-center px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg font-medium text-sm transition-colors gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                    </svg>
                                    <span>Bookmarks</span>
                                </Link>
                                <Link to="/collections" className="flex items-center px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg font-medium text-sm transition-colors gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                                    </svg>
                                    <span>Collections</span>
                                </Link>
                                <Link to="/my-posts" className="flex items-center px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg font-medium text-sm transition-colors gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    <span>My Posts</span>
                                </Link>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider text-slate-600">Trending Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {['JavaScript', 'React', 'Node.js', 'Python', 'Design', 'Career', 'AI', 'System Design'].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full hover:bg-cyan-100 hover:text-cyan-700 hover:border-cyan-200 border border-slate-200 cursor-pointer transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Feed */}
                    <div className="lg:col-start-2 space-y-6">
                        {/* Feed Header */}
                        {!loading && !user?.skills?.length && (
                            <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-fade-in-down">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                                        ✨
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">Personalize Your Feed</h3>
                                        <p className="text-slate-600 text-sm">Select your technical interests to see the most relevant content.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Link
                                        to="/settings/profile"
                                        className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap"
                                    >
                                        Customize Now
                                    </Link>
                                    <Link
                                        to="/community"
                                        className="btn-secondary bg-white px-5 py-2.5 text-sm whitespace-nowrap"
                                    >
                                        Explore
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Existing Feed Logic */}
                        <>
                            <div className="flex items-center justify-between glass-card p-2 rounded-xl">
                                <div className="flex space-x-1">
                                    {['all', 'question', 'article'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f
                                                ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                }`}
                                        >
                                            {f}s
                                        </button>
                                    ))}
                                </div>
                                <Link to="/create-post" className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </Link>
                            </div>

                            {loading && posts.length === 0 ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((item) => (
                                        <div key={`skeleton-${item}`} className="glass-card p-6 animate-pulse">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                                    <div>
                                                        <div className="h-3 w-28 bg-slate-200 rounded"></div>
                                                        <div className="h-2 w-20 bg-slate-200 rounded mt-2"></div>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                                            </div>
                                            <div className="h-4 w-3/4 bg-slate-200 rounded mb-3"></div>
                                            <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
                                            <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                                            <div className="mt-4 flex gap-2">
                                                <div className="h-6 w-14 bg-slate-200 rounded"></div>
                                                <div className="h-6 w-16 bg-slate-200 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div layout className="space-y-4">
                                    {filteredPosts.map((post, i) => {
                                        const isLiked = user ? post.likes?.includes(user._id) : false;
                                        const isSaved = user ? post.bookmarks?.includes(user._id) : false;
                                        const isAuthor = user && post.author?._id === user._id;
                                        const showFollow = !isAuthor && !!post.author?._id;
                                        const isFollowing = !!post.isFollowingAuthor;
                                        return (
                                            <motion.div
                                                key={post._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="glass-card p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors"
                                            >
                                                <div className={`absolute top-0 left-0 w-1 h-full ${post.type === 'question' ? 'bg-orange-500' : 'bg-blue-500'
                                                    }`}></div>

                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.name || 'User'}&background=e2e8f0&color=0f172a`}
                                                            className="w-10 h-10 rounded-full border border-slate-200"
                                                        />
                                                        <div>
                                                            {post.author?._id ? (
                                                                <Link to={`/users/${post.author._id}`} className="font-bold text-slate-900 hover:text-cyan-600 transition-colors text-sm block">
                                                                    {post.author.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="font-bold text-slate-900 text-sm block">
                                                                    {post.author?.name || 'Unknown User'}
                                                                </span>
                                                            )}
                                                            <div className="text-xs text-slate-500 font-medium">
                                                                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${post.type === 'question' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                                            }`}>
                                                            {post.type}
                                                        </span>
                                                        {showFollow && (
                                                            <button
                                                                onClick={() => handleFollow(post.author._id)}
                                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${isFollowing
                                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                                    : 'bg-white text-slate-600 border-slate-200 hover:text-cyan-600 hover:border-cyan-200'
                                                                    }`}
                                                            >
                                                                {isFollowing ? 'Following' : 'Follow'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <Link to={`/posts/${post._id}`} className="block group-hover:opacity-100 transition-opacity">
                                                    <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors">
                                                        {post.title}
                                                    </h2>
                                                    <p className="text-slate-600 line-clamp-2 mb-4 text-sm leading-relaxed">
                                                        {post.excerpt || (post.content ? post.content.replace(/[#*`]/g, '') : '')}
                                                    </p>
                                                </Link>

                                                {post.feedReasons && post.feedReasons.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {post.feedReasons.map((reason, idx) => (
                                                            <span key={`${post._id}-reason-${idx}`} className="text-[10px] uppercase tracking-widest font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full border border-indigo-200">
                                                                {reason}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {post.tags?.slice(0, 3).map((tag: string) => (
                                                        <span key={tag} className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded hover:text-cyan-600 transition-colors">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => handleLike(post._id)}
                                                            className={`flex items-center text-sm transition-colors ${isLiked ? 'text-cyan-700' : 'text-slate-600 group-hover:text-slate-700'}`}
                                                        >
                                                            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                            {post.likes?.length || 0}
                                                        </button>
                                                        <div className="flex items-center text-slate-600 text-sm group-hover:text-slate-700 transition-colors">
                                                            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                            {post.comments?.length || 0}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 items-center">
                                                        <button
                                                            onClick={() => handleSave(post._id)}
                                                            className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded border transition-colors ${isSaved ? 'text-cyan-700 bg-cyan-100 border-cyan-200' : 'text-slate-600 bg-slate-100 border-slate-200 hover:text-cyan-600'}`}
                                                        >
                                                            {isSaved ? 'Saved' : 'Save'}
                                                        </button>
                                                        {isAuthor && (
                                                            <Link
                                                                to={`/posts/${post._id}`}
                                                                className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded border border-slate-200 text-slate-600 hover:text-cyan-600 bg-white"
                                                            >
                                                                Edit
                                                            </Link>
                                                        )}
                                                        {isAuthor && (
                                                            <button
                                                                onClick={() => handleDelete(post._id)}
                                                                className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded border border-red-200 text-red-600 hover:text-red-700 bg-red-50"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </>

                    </div>

                    {/* Right Sidebar (Stats/Leaderboard) */}
                    <div className="lg:col-start-3 hidden lg:block space-y-6 sticky top-28 h-fit">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="font-bold text-lg mb-1 relative z-10">Weekly Challenge</h3>
                            <p className="text-indigo-100 text-sm mb-4 relative z-10">Complete 3 Learning Paths to earn the "Fast Learner" badge.</p>
                            <div className="w-full bg-black/20 rounded-full h-2 mb-2 relative z-10">
                                <div className="bg-white rounded-full h-2 w-1/3 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                            </div>
                            <div className="flex justify-between text-xs text-indigo-100 font-medium relative z-10">
                                <span>1/3 Completed</span>
                                <span>33%</span>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center text-sm uppercase tracking-wider text-slate-600">
                                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                Top Contributors
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-100 p-2 -mx-2 rounded-lg transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : i === 2 ? 'bg-slate-200 text-slate-600 border border-slate-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>{i}</div>
                                            <span className="font-medium text-slate-700 text-sm group-hover:text-slate-900 transition-colors">User {i}</span>
                                        </div>
                                        <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full border border-cyan-200">1.2k pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default KnowledgeFeed;
