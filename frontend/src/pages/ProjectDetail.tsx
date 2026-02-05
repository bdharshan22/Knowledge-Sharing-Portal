import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import Navbar from '../components/AppNavbar';

const ProjectDetail = () => {
    const { id } = useParams();
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await api.get(`/projects/${id}`);
                setProject(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const handleLike = async () => {
        try {
            const res = await api.put(`/projects/${id}/like`);
            setProject((prev: any) => ({ ...prev, likes: res.data }));
        } catch (err) {
            console.error('Error liking project:', err);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post(`/projects/${id}/comments`, {
                text: commentText
            });
            setProject((prev: any) => ({ ...prev, comments: res.data }));
            setCommentText('');
        } catch (err) {
            console.error('Error commenting:', err);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!project) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Project not found</h2>
                <Link to="/projects" className="text-indigo-600 hover:text-indigo-800 mt-2 block">Back to Gallery</Link>
            </div>
        </div>
    );

    const isLiked = user && project.likes.includes(user._id);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Hero Section */}
            <div className="relative pt-20 pb-12 bg-slate-100 overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <img
                        src={project.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80'}
                        alt=""
                        className="w-full h-full object-cover blur-3xl transform scale-110"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/80 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <Link to="/projects" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Gallery
                        </Link>

                        <div className="flex flex-wrap gap-3 mb-4">
                            {project.tags.map((tag: string) => (
                                <span key={tag} className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-tight">
                            {project.title}
                        </h1>

                        <div className="flex items-center space-x-6 text-slate-600">
                            <div className="flex items-center">
                                <img src={project.author.avatar || `https://ui-avatars.com/api/?name=${project.author.name}`} className="w-10 h-10 rounded-full border-2 border-slate-200 mr-3" alt="" />
                                <span className="font-medium text-slate-900">{project.author.name}</span>
                            </div>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {project.views} views
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                            {project.coverImage && (
                                <div className="h-[400px] w-full bg-slate-100">
                                    <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-8 prose prose-slate max-w-none">
                                <ReactMarkdown>{project.description}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Discussion ({project.comments.length})</h3>

                            {user ? (
                                <form onSubmit={handleComment} className="mb-8 flex gap-4">
                                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <textarea
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                                            placeholder="What are your thoughts?"
                                        />
                                        <div className="mt-2 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={!commentText.trim()}
                                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                Post Comment
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-slate-50 rounded-xl p-6 text-center mb-8 border border-slate-100">
                                    <p className="text-slate-600">Please <Link to="/login" className="text-indigo-600 font-medium hover:underline">log in</Link> to leave a comment.</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                {project.comments.map((comment: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        <img src={comment.user.avatar || `https://ui-avatars.com/api/?name=${comment.user.name}`} className="w-10 h-10 rounded-full bg-slate-100" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">{comment.user.name}</span>
                                                <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg rounded-tl-none inline-block">
                                                {comment.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {project.comments.length === 0 && (
                                    <div className="text-center text-slate-400 italic py-4">No comments yet. Be the first!</div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <button
                                onClick={handleLike}
                                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-all ${isLiked
                                    ? 'bg-red-50 text-red-600 shadow-inner'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/60'
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{isLiked ? 'Liked Project' : 'Like Project'}</span>
                            </button>

                            {project.repoLink && (
                                <a
                                    href={project.repoLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" /></svg>
                                    <span>View Source Code</span>
                                </a>
                            )}
                            {project.demoLink && (
                                <a
                                    href={project.demoLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center space-x-2 bg-indigo-50 border border-indigo-100 text-indigo-700 py-3 rounded-xl hover:bg-indigo-100 font-medium transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    <span>Live Demo</span>
                                </a>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                                <span className="w-1 h-5 bg-indigo-500 rounded-full mr-2"></span>
                                Project Stats
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-slate-50 rounded-xl">
                                    <div className="text-2xl font-bold text-slate-900">{project.views}</div>
                                    <div className="text-xs text-slate-500 uppercase font-medium">Total Views</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-xl">
                                    <div className="text-2xl font-bold text-slate-900">{project.likes.length}</div>
                                    <div className="text-xs text-slate-500 uppercase font-medium">Likes</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-xl col-span-2">
                                    <div className="text-2xl font-bold text-slate-900">{project.comments.length}</div>
                                    <div className="text-xs text-slate-500 uppercase font-medium">Comments</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
