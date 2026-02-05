import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/AppNavbar';
import api from '../services/api';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<any>({ posts: [], users: [], projects: [] });
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Load search history
    useEffect(() => {
        const history = localStorage.getItem('ksp_search_history');
        if (history) {
            try {
                setSearchHistory(JSON.parse(history));
            } catch (e) {
                console.error('Failed to parse search history');
            }
        }
    }, []);

    const addToHistory = (q: string) => {
        if (!q.trim()) return;
        const newHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('ksp_search_history', JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('ksp_search_history');
    };

    useEffect(() => {
        if (query) {
            handleSearch();
            addToHistory(query);
        }
    }, [query, typeFilter, tagFilter, difficultyFilter, timeFilter]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get('/search', {
                params: {
                    q: query,
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    tag: tagFilter || undefined,
                    difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
                    time: timeFilter !== 'all' ? timeFilter : undefined
                }
            });
            setResults(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const highlightText = (text: string) => {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'ig');
        const parts = text.split(regex);
        return parts.map((part, idx) =>
            idx % 2 === 1 ? (
                <mark key={`hl-${idx}`} className="bg-amber-200/70 text-slate-900 px-1 rounded">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const hasResults = useMemo(() => {
        return results.posts.length > 0 || results.users.length > 0 || results.projects.length > 0;
    }, [results]);

    return (
        <div className="min-h-screen relative pb-20 overflow-x-hidden">
            <Navbar />

            {/* Background elements */}
            <div className="fixed inset-0 gradient-mesh-subtle z-0" />
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-[100px] animate-pulse z-0 pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">
                            Search Results
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-600">
                            <span>Showing results for "{query}".</span>
                            {lastUpdated && (
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
                                    Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {loading && (
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100 border border-cyan-200 px-2 py-1 rounded-full">
                                    Updating...
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="glass-premium p-6 rounded-3xl animate-slide-up">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">
                                Filters & Refinements
                            </div>
                            {(typeFilter !== 'all' || difficultyFilter !== 'all' || timeFilter !== 'all' || tagFilter) && (
                                <button
                                    onClick={() => {
                                        setTypeFilter('all');
                                        setDifficultyFilter('all');
                                        setTimeFilter('all');
                                        setTagFilter('');
                                    }}
                                    className="text-xs text-red-500 font-bold hover:underline"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                >
                                    <option value="all">All Content</option>
                                    <option value="article">Articles</option>
                                    <option value="question">Questions</option>
                                    <option value="resource">Resources</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Difficulty</label>
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                >
                                    <option value="all">Any Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Time</label>
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                >
                                    <option value="all">Anytime</option>
                                    <option value="week">Past Week</option>
                                    <option value="month">Past Month</option>
                                    <option value="year">Past Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Tag</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={tagFilter}
                                        onChange={(e) => setTagFilter(e.target.value)}
                                        placeholder="Type tag..."
                                        className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 pl-9 text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                    />
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && results.posts.length === 0 && results.users.length === 0 && results.projects.length === 0 && (
                    <div className="mt-8 space-y-6">
                        {[1, 2, 3].map((item) => (
                            <div key={`search-skeleton-${item}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse">
                                <div className="h-3 w-20 bg-slate-200 rounded mb-3"></div>
                                <div className="h-5 w-2/3 bg-slate-200 rounded mb-2"></div>
                                <div className="h-3 w-full bg-slate-200 rounded mb-2"></div>
                                <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (
                    <div className="mt-8 space-y-10">
                        {results.users.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">People</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {results.users.map((user: any) => (
                                        <Link to={`/users/${user._id}`} key={user._id} className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-cyan-300">
                                            <img src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'} className="w-10 h-10 rounded-full mr-3" />
                                            <div>
                                                <div className="font-bold text-slate-900">{highlightText(user.name || '')}</div>
                                                <div className="text-xs text-slate-500">@{user.username}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.posts.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">Posts</h2>
                                <div className="space-y-4">
                                    {results.posts.map((post: any) => (
                                        <Link to={`/posts/${post._id}`} key={post._id} className="block p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-cyan-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{post.type || 'post'}</span>
                                                <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">{highlightText(post.title)}</h3>
                                            <p className="text-slate-600 mt-2 line-clamp-2">{highlightText(post.excerpt || (post.content ? post.content.substring(0, 160) + '...' : ''))}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {(post.tags || []).slice(0, 3).map((tag: string) => (
                                                    <span key={tag} className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                                        #{highlightText(tag)}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-3 text-xs text-slate-500">
                                                by {post.author?.name || 'Unknown'}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.projects.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">Projects</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.projects.map((proj: any) => (
                                        <Link to={`/projects/${proj._id}`} key={proj._id} className="block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md">
                                            <div className="h-32 bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${proj.coverImage || 'https://via.placeholder.com/400x200'})` }}></div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-slate-900">{highlightText(proj.title)}</h3>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{highlightText(proj.description || '')}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasResults && (
                            <div className="text-center py-20 animate-fade-in-scale">
                                <div className="inline-flex items-center justify-center p-6 bg-slate-50 rounded-full mb-6">
                                    <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8">
                                    We couldn't find anything matching "{query}". Try adjusting your filters or checking for typos.
                                </p>

                                {searchHistory.length > 0 && (
                                    <div className="max-w-md mx-auto text-left">
                                        <div className="flex items-center justify-between mb-3 text-xs uppercase font-bold tracking-wider text-slate-400">
                                            <span>Recent Searches</span>
                                            <button onClick={clearHistory} className="text-red-400 hover:text-red-500">Clear</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {searchHistory.map((term, idx) => (
                                                <Link
                                                    key={idx}
                                                    to={`/search?q=${encodeURIComponent(term)}`}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-cyan-400 hover:text-cyan-700 transition-colors"
                                                >
                                                    {term}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
