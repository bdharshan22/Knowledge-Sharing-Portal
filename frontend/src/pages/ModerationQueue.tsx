import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/AppNavbar';
import { AuthContext } from '../context/AuthContext';

interface Flag {
    reason: string;
    description?: string;
    createdAt: string;
}

interface Post {
    _id: string;
    title: string;
    author?: { name?: string; avatar?: string };
    flags?: Flag[];
    moderationStatus?: string;
    type?: string;
    category?: string;
    updatedAt?: string;
}

const ModerationQueue = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const isModerator = user && (user.role === 'admin' || user.role === 'moderator');

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState('');

    const fetchQueue = async () => {
        try {
            const res = await api.get('/moderation/posts');
            setPosts(res.data || []);
        } catch (err: any) {
            console.error('Failed to load moderation queue', err);
            setError(err?.response?.data?.message || 'Failed to load moderation queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isModerator) {
            fetchQueue();
        } else {
            setLoading(false);
        }
    }, [isModerator]);

    const handleResolve = async (postId: string, status: 'approved' | 'rejected') => {
        try {
            setActionLoading(prev => ({ ...prev, [postId]: true }));
            await api.put(`/moderation/posts/${postId}`, { status, note: notes[postId] || '' });
            setPosts(prev => prev.filter(post => post._id !== postId));
        } catch (err: any) {
            console.error('Failed to resolve post', err);
            alert(err?.response?.data?.message || 'Failed to resolve post');
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isModerator) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                        <h1 className="text-2xl font-bold text-slate-900">Restricted Area</h1>
                        <p className="text-slate-600 mt-2">You do not have permission to view the moderation queue.</p>
                        <Link to="/dashboard" className="inline-flex mt-6 px-6 py-3 btn-primary">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Moderation Queue</h1>
                        <p className="text-slate-600 mt-2">Review flagged and pending posts in one place.</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchQueue}
                        className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100"
                    >
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {posts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                        <h2 className="text-xl font-bold text-slate-900">Queue is clear</h2>
                        <p className="text-slate-600 mt-2">No posts need review right now.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => {
                            const reasons = post.flags?.length
                                ? post.flags.map(flag => flag.reason)
                                : ['auto-flagged'];

                            return (
                                <div key={post._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {post.type && (
                                                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                        {post.type}
                                                    </span>
                                                )}
                                                {post.moderationStatus && (
                                                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${post.moderationStatus === 'pending'
                                                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        }`}>
                                                        {post.moderationStatus}
                                                    </span>
                                                )}
                                                {post.category && (
                                                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                        {post.category}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-900">{post.title}</h2>
                                            <div className="text-sm text-slate-500 mt-1">
                                                by {post.author?.name || 'Unknown author'}
                                                {post.updatedAt && ` · Updated ${new Date(post.updatedAt).toLocaleDateString()}`}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {reasons.map((reason, idx) => (
                                                    <span key={`${post._id}-reason-${idx}`} className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                        {reason}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Link
                                            to={`/posts/${post._id}`}
                                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold uppercase tracking-wide text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
                                        >
                                            View Post
                                        </Link>
                                    </div>

                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
                                        <textarea
                                            value={notes[post._id] || ''}
                                            onChange={(e) => setNotes(prev => ({ ...prev, [post._id]: e.target.value }))}
                                            placeholder="Optional moderator note (visible in edit history)."
                                            rows={3}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                                        />
                                        <div className="flex gap-3 md:flex-col">
                                            <button
                                                type="button"
                                                onClick={() => handleResolve(post._id, 'rejected')}
                                                disabled={actionLoading[post._id]}
                                                className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleResolve(post._id, 'approved')}
                                                disabled={actionLoading[post._id]}
                                                className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-60"
                                            >
                                                Approve
                                            </button>
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

export default ModerationQueue;
