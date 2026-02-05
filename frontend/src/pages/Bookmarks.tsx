import { useEffect, useMemo, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/AppNavbar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface Post {
    _id: string;
    title: string;
    content: string;
    author: { _id: string; name: string; avatar?: string };
    createdAt: string;
    likes: string[];
    bookmarks?: string[];
    comments: any[];
    type: string;
    tags?: string[];
}

const Bookmarks = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const navigate = useNavigate();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'recent' | 'liked' | 'type'>('recent');

    const fetchBookmarks = async () => {
        try {
            const res = await api.get('/users/bookmarks');
            const next = res.data.bookmarks || [];
            setPosts(next);
            sessionStorage.setItem('ksp_bookmarks_cache_v1', JSON.stringify({ ts: Date.now(), data: next }));
        } catch (error) {
            console.error('Failed to load bookmarks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = sessionStorage.getItem('ksp_bookmarks_cache_v1');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed?.data) && Date.now() - parsed.ts < 1000 * 60 * 5) {
                    setPosts(parsed.data);
                    setLoading(false);
                }
            } catch {
                // ignore cache parse errors
            }
        }
        fetchBookmarks();
    }, []);

    const sortedPosts = useMemo(() => {
        if (sortBy === 'liked') {
            return [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }
        if (sortBy === 'type') {
            return [...posts].sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        }
        return [...posts].reverse();
    }, [posts, sortBy]);

    const handleLike = async (postId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.put(`/posts/${postId}/like`);
            setPosts(prev => prev.map(post => post._id === postId ? { ...post, likes: data } : post));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleSave = async (postId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.put(`/posts/${postId}/bookmark`);
            if (data?.isBookmarked === false) {
                setPosts(prev => prev.filter(post => post._id !== postId));
                return;
            }
            fetchBookmarks();
        } catch (error) {
            console.error('Error saving post:', error);
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
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Your Bookmarks</h1>
                        <p className="text-slate-600 mt-2">Quick access to the posts you saved for later.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sort</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'recent' | 'liked' | 'type')}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            >
                                <option value="recent">Recently saved</option>
                                <option value="liked">Most liked</option>
                                <option value="type">Type</option>
                            </select>
                        </div>
                        <Link to="/dashboard" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                            Back to feed
                        </Link>
                    </div>
                </div>

                {loading && posts.length === 0 ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((item) => (
                            <div key={`bookmark-skeleton-${item}`} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-full bg-slate-200 rounded"></div>
                                        <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                                        <div className="flex gap-2">
                                            <div className="h-5 w-12 bg-slate-200 rounded"></div>
                                            <div className="h-5 w-14 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-10 w-20 bg-slate-200 rounded"></div>
                                </div>
                                <div className="mt-6 h-8 w-32 bg-slate-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                        <h2 className="text-xl font-bold text-slate-900">No saved posts yet</h2>
                        <p className="text-slate-600 mt-2">Browse the feed and save posts you want to revisit.</p>
                        <Link to="/dashboard" className="inline-flex mt-6 px-6 py-3 btn-primary">
                            Explore Feed
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedPosts.map((post) => {
                            const isLiked = user ? post.likes?.includes(user._id) : false;
                            const isAuthor = user && post.author?._id === user._id;

                            return (
                                <div key={post._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <Link to={`/posts/${post._id}`} className="text-xl font-bold text-slate-900 hover:text-cyan-700">
                                                {post.title}
                                            </Link>
                                            <p className="text-slate-600 mt-2 line-clamp-2">{post.content.replace(/[#*`]/g, '')}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {post.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            <div>by {post.author?.name || 'Unknown'}</div>
                                            <div>{new Date(post.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                                        <div className="flex gap-4 text-sm">
                                            <button
                                                onClick={() => handleLike(post._id)}
                                                className={`flex items-center gap-2 ${isLiked ? 'text-cyan-700' : 'text-slate-600 hover:text-cyan-600'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                {post.likes?.length || 0} Likes
                                            </button>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                {post.comments?.length || 0} Comments
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSave(post._id)}
                                                className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded border border-slate-200 text-slate-600 hover:text-cyan-600 bg-slate-100"
                                            >
                                                Remove
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookmarks;
