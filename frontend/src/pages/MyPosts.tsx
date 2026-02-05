import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/AppNavbar';
import { AuthContext } from '../context/AuthContext';

interface Post {
    _id: string;
    title: string;
    content: string;
    excerpt?: string;
    createdAt: string;
    likes: string[];
    comments: any[];
    type: string;
    views?: number;
    bookmarks?: string[];
}

const MyPosts = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const navigate = useNavigate();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts', { params: { author: 'me' } });
            setPosts(res.data || []);
        } catch (err) {
            console.error('Failed to load posts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

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

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">My Posts</h1>
                        <p className="text-slate-600 mt-2">Manage and review everything you have published.</p>
                    </div>
                    <Link to="/create-post" className="btn-primary px-4 py-2 text-sm">
                        New Post
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-slate-300 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                        <h2 className="text-xl font-bold text-slate-900">No posts yet</h2>
                        <p className="text-slate-600 mt-2">Start sharing knowledge with the community.</p>
                        <Link to="/create-post" className="inline-flex mt-6 px-6 py-3 btn-primary">
                            Create Post
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <div key={post._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <Link to={`/posts/${post._id}`} className="text-xl font-bold text-slate-900 hover:text-cyan-700">
                                            {post.title}
                                        </Link>
                                        <p className="text-slate-600 mt-2 line-clamp-2">{post.excerpt || (post.content ? post.content.replace(/[#*`]/g, '') : '')}</p>
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            <span>{post.type}</span>
                                            <span>{post.views || 0} views</span>
                                            <span>{post.likes?.length || 0} likes</span>
                                            <span>{post.bookmarks?.length || 0} saves</span>
                                            <span>{post.comments?.length || 0} comments</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/posts/${post._id}`}
                                            className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded border border-slate-200 text-slate-600 hover:text-cyan-600 bg-white"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(post._id)}
                                            className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded border border-red-200 text-red-600 hover:text-red-700 bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPosts;
