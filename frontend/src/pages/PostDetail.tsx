import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

import Navbar from '../components/AppNavbar';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import TableOfContents from '../components/TableOfContents';

interface Answer {
    _id: string;
    content: string;
    author: { _id: string, name: string, avatar?: string };
    votes: { up: string[], down: string[] };
    isAccepted: boolean;
    createdAt: string;
}

interface Comment {
    _id: string;
    text: string;
    user: { _id: string, name: string, avatar?: string };
    createdAt: string;
}

interface Post {
    _id: string;
    title: string;
    content: string;
    author: { _id: string, name: string, avatar?: string };
    likes: string[];
    bookmarks?: string[];
    answers: Answer[];
    comments: Comment[];
    type: 'article' | 'question' | 'resource';
    acceptedAnswer?: string;
    createdAt: string;
    views?: number;
    updatedAt?: string;
    attachments?: { name: string, url: string, type: string, size: number }[];
    category?: string;
    visibility?: 'public' | 'private' | 'followers';
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    tags?: string[];
    isEdited?: boolean;
    editHistory?: {
        _id?: string;
        editedBy?: { _id: string; name: string; avatar?: string };
        editedAt?: string;
        reason?: string;
        changes?: string;
    }[];
    summary?: {
        status?: 'idle' | 'processing' | 'ready' | 'error';
        tldr?: string;
        keyTakeaways?: string[];
        generatedAt?: string;
        error?: string;
    };
}

interface Collection {
    _id: string;
    name: string;
    posts?: string[];
}

const PostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editVisibility, setEditVisibility] = useState<'public' | 'private' | 'followers'>('public');
    const [editType, setEditType] = useState<Post['type']>('article');
    const [editDifficulty, setEditDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [editReason, setEditReason] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [showEditHistory, setShowEditHistory] = useState(false);
    const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
    const [collectionModalOpen, setCollectionModalOpen] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [creatingCollection, setCreatingCollection] = useState(false);
    const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    const fetchPost = useCallback(async () => {
        try {
            const { data } = await api.get(`/posts/${id}`);
            setPost(data.post || data);
        } catch (error) {
            console.error('Error fetching post', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await api.delete(`/posts/${id}`);
                navigate('/');
            } catch {
                alert('Failed to delete post');
            }
        }
    };

    const handleLike = async () => {
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        try {
            await api.put(`/posts/${id}/like`);
            fetchPost();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleSave = async () => {
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        try {
            await api.put(`/posts/${id}/bookmark`);
            fetchPost();
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    const handleGenerateSummary = async () => {
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        try {
            setSummaryLoading(true);
            setPost(prev => prev ? { ...prev, summary: { ...(prev.summary || {}), status: 'processing' } } : prev);
            const { data } = await api.post(`/posts/${id}/summary`);
            setPost(prev => prev ? { ...prev, summary: data } : prev);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to generate summary';
            setPost(prev => prev ? { ...prev, summary: { ...(prev.summary || {}), status: 'error', error: message } } : prev);
            console.error('Failed to generate summary', error);
            alert(message);
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleReport = async () => {
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        const allowedReasons = ['spam', 'inappropriate', 'duplicate', 'off-topic', 'other'];
        const rawReason = window.prompt('Report reason (spam, inappropriate, duplicate, off-topic, other):', 'other') || 'other';
        const normalizedReason = rawReason.trim().toLowerCase();
        const reason = allowedReasons.includes(normalizedReason) ? normalizedReason : 'other';
        const description = window.prompt('Optional details for moderators:', '') || '';

        try {
            await api.post(`/posts/${id}/report`, { reason, description });
            alert('Thanks. Your report has been submitted.');
        } catch (error) {
            console.error('Failed to report post', error);
            alert('Failed to report post');
        }
    };

    const handleToggleFollow = async () => {
        if (!post?.author?._id) return;
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        try {
            setFollowLoading(true);
            const { data } = await api.put(`/users/${post.author._id}/follow`);
            setIsFollowingAuthor(!!data?.isFollowing);
        } catch (error) {
            console.error('Failed to toggle follow', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const fetchCollections = async () => {
        try {
            setCollectionsLoading(true);
            const { data } = await api.get('/users/collections');
            setCollections(data.collections || []);
        } catch (error) {
            console.error('Failed to load collections', error);
        } finally {
            setCollectionsLoading(false);
        }
    };

    useEffect(() => {
        const loadFollowStatus = async () => {
            if (!post?.author?._id || !auth?.user || post.author._id === auth.user._id) {
                setIsFollowingAuthor(false);
                return;
            }

            try {
                const { data } = await api.get(`/users/${post.author._id}`);
                const followers = data?.user?.followers || [];
                const isFollowing = followers.some((f: any) => f._id === auth?.user?._id);
                setIsFollowingAuthor(isFollowing);
            } catch (error) {
                console.error('Failed to load follow status', error);
            }
        };

        loadFollowStatus();
    }, [post?.author?._id, auth?.user?._id]);

    useEffect(() => {
        if (collectionModalOpen) {
            fetchCollections();
        }
    }, [collectionModalOpen]);

    const handleToggleCollection = async (collectionId: string) => {
        if (!post) return;
        try {
            const collection = collections.find(c => c._id === collectionId);
            const hasPost = collection?.posts?.some((item: any) => (typeof item === 'string' ? item : item._id) === post._id) || false;

            if (hasPost) {
                await api.delete(`/users/collections/${collectionId}/posts/${post._id}`);
                setCollections(prev => prev.map(c => c._id === collectionId
                    ? { ...c, posts: (c.posts || []).filter((item: any) => (typeof item === 'string' ? item : item._id) !== post._id) }
                    : c
                ));
            } else {
                await api.post(`/users/collections/${collectionId}/posts`, { postId: post._id });
                setCollections(prev => prev.map(c => c._id === collectionId
                    ? { ...c, posts: [...(c.posts || []), post._id] }
                    : c
                ));
            }
        } catch (error) {
            console.error('Failed to update collection', error);
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return;
        try {
            setCreatingCollection(true);
            const { data } = await api.post('/users/collections', { name: newCollectionName.trim() });
            setCollections(data.collections || []);
            setNewCollectionName('');
        } catch (error) {
            console.error('Failed to create collection', error);
        } finally {
            setCreatingCollection(false);
        }
    };

    const startEditing = () => {
        if (!post) return;
        setEditTitle(post.title);
        setEditContent(post.content);
        setEditTags((post.tags || []).join(', '));
        setEditCategory(post.category || '');
        setEditVisibility(post.visibility || 'public');
        setEditType(post.type || 'article');
        setEditDifficulty(post.difficulty || 'Beginner');
        setEditReason('');
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.put(`/posts/${id}`, {
                title: editTitle,
                content: editContent,
                tags: editTags.split(',').map(tag => tag.trim()).filter(Boolean),
                category: editCategory || post?.category,
                visibility: editVisibility,
                type: editType,
                difficulty: editDifficulty,
                editReason: editReason || 'Updated post'
            });
            setPost(data.post || data);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update post', error);
            alert('Failed to update post');
        }
    };

    const handleAccept = async (answerId: string) => {
        try {
            const { data } = await api.put(`/posts/${id}/answers/${answerId}/accept`);
            setPost(prev => prev ? { ...prev, answers: data, acceptedAnswer: answerId } : null);
        } catch (error) {
            console.error('Failed to accept answer', error);
        }
    };

    const handleVoteAnswer = async (answerId: string, type: 'up' | 'down') => {
        if (!auth?.user) return navigate('/login');
        try {
            const { data } = await api.put(`/posts/${id}/answers/${answerId}/vote`, { type });
            setPost(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    answers: prev.answers.map(a => a._id === answerId ? data : a)
                };
            });
        } catch (error) {
            console.error('Failed to vote', error);
        }
    };

    const handleSubmitResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.user) {
            navigate('/login');
            return;
        }

        try {
            if (post?.type === 'question') {
                await api.post(`/posts/${id}/answers`, { content: commentText });
            } else {
                await api.post(`/posts/${id}/comment`, { text: commentText });
            }
            setCommentText('');
            fetchPost();
        } catch {
            alert('Failed to submit');
        }
    };

    const handleDownloadPDF = async () => {
        if (!contentRef.current || !post) return;

        try {
            setIsPdfGenerating(true);
            const content = contentRef.current;

            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`${post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF', error);
            alert('Failed to generate PDF');
        } finally {
            setIsPdfGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 animate-pulse">
                    <div className="border-b border-slate-200 pb-8 mb-8">
                        <div className="h-6 w-24 bg-slate-200 rounded-full mb-4"></div>
                        <div className="h-10 w-3/4 bg-slate-200 rounded mb-4"></div>
                        <div className="flex flex-wrap gap-3">
                            <div className="h-5 w-24 bg-slate-200 rounded"></div>
                            <div className="h-5 w-32 bg-slate-200 rounded"></div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-6">
                            <div className="h-32 bg-slate-200 rounded-2xl"></div>
                            <div className="h-6 w-1/2 bg-slate-200 rounded"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-slate-200 rounded"></div>
                                <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                                <div className="h-4 w-4/6 bg-slate-200 rounded"></div>
                            </div>
                            <div className="h-48 bg-slate-200 rounded-2xl"></div>
                        </div>

                        <div className="w-full lg:w-80 hidden lg:block">
                            <div className="h-48 bg-slate-200 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Post not found</h2>
                <Link to="/" className="text-cyan-600 hover:text-cyan-500 mt-2 block">Back to Home</Link>
            </div>
        </div>
    );

    const isAuthor = auth?.user && post.author && auth.user._id === post.author._id;
    const isLiked = auth?.user ? post.likes?.includes(auth.user._id) : false;
    const isSaved = auth?.user ? post.bookmarks?.includes(auth.user._id) : false;
    const summaryStatus = post.summary?.status;
    const isSummaryProcessing = summaryLoading || summaryStatus === 'processing';
    const lastEdit = post.editHistory && post.editHistory.length > 0
        ? post.editHistory[post.editHistory.length - 1]
        : null;
    const updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;
    const createdAt = new Date(post.createdAt);
    const showUpdatedBadge = updatedAt ? Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60 * 1000 : false;
    const totalComments = post.type === 'question'
        ? (post.answers?.length || 0) + (post.comments?.length || 0)
        : (post.comments?.length || 0);
    const commentRate = post.views ? Math.round((totalComments / post.views) * 100) : 0;

    const parseChanges = (changes?: string) => {
        if (!changes) return null;
        try {
            return JSON.parse(changes);
        } catch {
            return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 font-sans text-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 right-0 w-[520px] h-[520px] bg-cyan-200/40 rounded-full blur-[140px]"></div>
                <div className="absolute -bottom-32 left-0 w-[520px] h-[520px] bg-indigo-200/40 rounded-full blur-[140px]"></div>
            </div>
            <Navbar />
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-8 shadow-sm"
                >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white via-white to-slate-100 opacity-70"></div>
                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full ${post.type === 'question' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                post.type === 'resource' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    'bg-cyan-100 text-cyan-700 border border-cyan-200'
                                }`}>
                                {post.type}
                            </span>
                            {post.category && (
                                <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-full border border-slate-200">
                                    {post.category}
                                </span>
                            )}
                            {post.difficulty && (
                                <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-200">
                                    {post.difficulty}
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 leading-tight tracking-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center text-sm text-slate-600 gap-3 mt-6">
                            <span className="flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                <svg className="w-4 h-4 mr-2 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {post.views || 0} views
                            </span>
                            {showUpdatedBadge && updatedAt && (
                                <span className="flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Updated {updatedAt.toLocaleDateString()}
                                </span>
                            )}
                            {lastEdit && (
                                <span className="flex items-center bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 text-amber-700">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Edited {new Date(lastEdit.editedAt || post.createdAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-8 right-8 flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isPdfGenerating}
                            className={`p-2 rounded-full border border-slate-200 bg-white/80 hover:bg-white text-slate-600 hover:text-cyan-600 transition-colors shadow-sm ${isPdfGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Download as PDF"
                        >
                            {isPdfGenerating ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                        </button>
                    </div>
                </motion.div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10" ref={contentRef}>
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="min-w-0 space-y-10"
                    >
                        {/* AI Summary */}
                        <div className="mb-8">
                            {summaryStatus === 'ready' ? (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-slate-900">TL;DR</h3>
                                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full border border-cyan-200">
                                            AI Summary
                                        </span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">{post.summary?.tldr}</p>
                                    {post.summary?.keyTakeaways && post.summary.keyTakeaways.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Key takeaways</div>
                                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                                                {post.summary.keyTakeaways.map((item, idx) => (
                                                    <li key={`takeaway-${idx}`}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : summaryStatus === 'error' ? (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-red-700">Summary unavailable</h3>
                                        <p className="text-red-600 text-sm mt-1 line-clamp-2">{post.summary?.error || 'We could not generate a summary right now.'}</p>
                                    </div>
                                    <button
                                        onClick={handleGenerateSummary}
                                        className="btn-primary px-5 py-2.5 text-sm"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : isSummaryProcessing ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Generating Summary</h3>
                                        <p className="text-slate-600 text-sm">We are crafting a TL;DR and key takeaways.</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Working...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">AI Summary</h3>
                                        <p className="text-slate-600 text-sm">Generate a concise TL;DR and key takeaways for this post.</p>
                                    </div>
                                    <button
                                        onClick={handleGenerateSummary}
                                        disabled={isSummaryProcessing}
                                        className="btn-primary px-5 py-2.5 text-sm"
                                    >
                                        {isSummaryProcessing ? 'Generating...' : 'Generate Summary'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Resource Attachments */}
                        {post.attachments && post.attachments.length > 0 && (
                            <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 backdrop-blur-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center text-slate-900">
                                    <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    Attachments & Resources
                                </h3>
                                <div className="grid gap-4">
                                    {post.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-300 transition-all bg-slate-50 hover:bg-slate-100 shadow-sm group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                                    {file.type === 'pdf' ? (
                                                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 group-hover:text-slate-900 transition-colors">{file.name}</div>
                                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{file.type} - {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                                </div>
                                            </div>
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-8 mb-16">
                            {/* Voting */}
                            <div className="flex flex-col items-center gap-1 text-slate-600">
                                <button
                                    onClick={handleLike}
                                    className={`p-3 rounded-2xl transition-all ${isLiked ? 'bg-cyan-100 text-cyan-700' : 'hover:bg-cyan-100 hover:text-cyan-600'}`}
                                    title="Upvote"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                </button>
                                <span className={`text-2xl font-bold ${isLiked ? 'text-cyan-700' : 'text-slate-500'}`}>{post.likes.length}</span>
                                <button className="p-3 hover:bg-red-100 hover:text-red-600 rounded-2xl transition-all" title="Downvote">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>

                            {/* Markdown Content */}
                            <div className="flex-1">
                                {isEditing ? (
                                    <form onSubmit={handleUpdate} className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Title</label>
                                                <input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                                                <input
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tags</label>
                                                <input
                                                    value={editTags}
                                                    onChange={(e) => setEditTags(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                    placeholder="react, typescript, webdev"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Type</label>
                                                <select
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as Post['type'])}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                >
                                                    <option value="article">Article</option>
                                                    <option value="question">Question</option>
                                                    <option value="resource">Resource</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Visibility</label>
                                                <select
                                                    value={editVisibility}
                                                    onChange={(e) => setEditVisibility(e.target.value as 'public' | 'private' | 'followers')}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="followers">Followers</option>
                                                    <option value="private">Private</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Difficulty</label>
                                                <select
                                                    value={editDifficulty}
                                                    onChange={(e) => setEditDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                >
                                                    <option value="Beginner">Beginner</option>
                                                    <option value="Intermediate">Intermediate</option>
                                                    <option value="Advanced">Advanced</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Edit Reason</label>
                                                <input
                                                    value={editReason}
                                                    onChange={(e) => setEditReason(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                                    placeholder="Explain what changed"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Content</label>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={10}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 font-mono text-sm"
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                                            <button type="button" onClick={cancelEditing} className="btn-secondary px-6 py-2.5">
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn-primary px-6 py-2.5">
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex gap-8">
                                        {/* Main Content */}
                                        <div className="flex-1 prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-slate-700 prose-a:text-cyan-700 prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200">
                                            <ReactMarkdown
                                                components={{
                                                    h2: ({ children, ...props }) => {
                                                        const text = String(children);
                                                        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                                        return <h2 id={id} {...props}>{children}</h2>;
                                                    },
                                                    h3: ({ children, ...props }) => {
                                                        const text = String(children);
                                                        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                                        return <h3 id={id} {...props}>{children}</h3>;
                                                    }
                                                }}
                                            >
                                                {post.content}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Table of Contents */}
                                        <TableOfContents content={post.content} minWordCount={1000} />
                                    </div>
                                )}

                                {post.editHistory && post.editHistory.length > 0 && (
                                    <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Edit History</h3>
                                                <p className="text-sm text-slate-600">Track how this post has evolved.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowEditHistory(prev => !prev)}
                                                className="text-xs font-bold uppercase tracking-wider text-cyan-700"
                                            >
                                                {showEditHistory ? 'Hide' : 'View'}
                                            </button>
                                        </div>

                                        {showEditHistory && (
                                            <div className="space-y-4">
                                                {post.editHistory.slice().reverse().map((edit) => {
                                                    const changes = parseChanges(edit.changes);
                                                    const editId = edit._id || `${edit.editedAt}-${edit.reason}`;
                                                    return (
                                                        <div key={editId} className="border border-slate-200 rounded-xl p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm font-semibold text-slate-800">
                                                                    {edit.editedBy?.name || 'Editor'} - {edit.editedAt ? new Date(edit.editedAt).toLocaleDateString() : 'Unknown date'}
                                                                </div>
                                                                {changes && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedEditId(expandedEditId === editId ? null : editId)}
                                                                        className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                                                                    >
                                                                        {expandedEditId === editId ? 'Hide changes' : 'View changes'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1">{edit.reason || 'Updated post'}</div>

                                                            {changes && expandedEditId === editId && (
                                                                <div className="mt-4 space-y-4">
                                                                    {Object.entries(changes).map(([field, value]: any) => {
                                                                        const fromValue = Array.isArray(value?.from) ? value.from.join(', ') : value?.from;
                                                                        const toValue = Array.isArray(value?.to) ? value.to.join(', ') : value?.to;
                                                                        return (
                                                                            <div key={`${editId}-${field}`}>
                                                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{field}</div>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                                                                                        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Before</div>
                                                                                        <div className="whitespace-pre-wrap">{fromValue || '-'}</div>
                                                                                    </div>
                                                                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-slate-700">
                                                                                        <div className="text-[10px] uppercase tracking-widest text-emerald-600 mb-1">After</div>
                                                                                        <div className="whitespace-pre-wrap">{toValue || '-'}</div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    <div className="flex flex-wrap gap-4">
                                        <button className="text-slate-600 hover:text-cyan-600 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                            Share
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className={`text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2 ${isSaved ? 'text-cyan-700' : 'text-slate-600 hover:text-cyan-600'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                            {isSaved ? 'Saved' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => auth?.user ? setCollectionModalOpen(true) : navigate('/login')}
                                            className="text-slate-600 hover:text-cyan-600 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" /></svg>
                                            Add to Collection
                                        </button>
                                        <button
                                            onClick={handleReport}
                                            className="text-slate-600 hover:text-red-600 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16m0-16h11l-1 4 4 2-4 2 1 4H4" /></svg>
                                            Report
                                        </button>
                                        {isAuthor && !isEditing && (
                                            <button
                                                onClick={startEditing}
                                                className="text-slate-600 hover:text-cyan-600 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                                Edit
                                            </button>
                                        )}
                                        {isAuthor && (
                                            <button
                                                onClick={handleDelete}
                                                className="text-red-600 hover:text-red-700 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Delete
                                            </button>
                                        )}
                                    </div>

                                    {post.author && (
                                        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 w-full lg:max-w-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=e2e8f0&color=0f172a`}
                                                        className="w-12 h-12 rounded-full ring-2 ring-slate-100"
                                                        alt={post.author.name}
                                                    />
                                                    <div>
                                                        <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Author</div>
                                                        <Link to={`/users/${post.author._id}`} className="text-lg font-bold text-slate-900 hover:text-cyan-600 transition-colors">
                                                            {post.author.name}
                                                        </Link>
                                                        <div className="text-xs text-slate-500 mt-1">Posted {new Date(post.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                {!isAuthor && (
                                                    <button
                                                        onClick={handleToggleFollow}
                                                        disabled={followLoading}
                                                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full border transition-colors ${isFollowingAuthor
                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:text-cyan-600 hover:border-cyan-200'
                                                            }`}
                                                    >
                                                        {followLoading ? 'Updating...' : isFollowingAuthor ? 'Following' : 'Follow'}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {post.category && (
                                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                                        {post.category}
                                                    </span>
                                                )}
                                                {post.difficulty && (
                                                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase tracking-wider">
                                                        {post.difficulty}
                                                    </span>
                                                )}
                                                {post.visibility && (
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider">
                                                        {post.visibility}
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                to={`/users/${post.author._id}`}
                                                className="text-xs font-bold uppercase tracking-widest text-cyan-700 hover:text-cyan-800"
                                            >
                                                View profile
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Answers / Comments Section */}
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    {post.type === 'question' ? (
                                        <>
                                            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                            </span>
                                            {post.answers?.length || 0} Answers
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                            </span>
                                            Comments ({post.comments?.length || 0})
                                        </>
                                    )}
                                </h2>
                            </div>

                            {post.type === 'question' ? (
                                <div className="space-y-6">
                                    {post.answers?.map(answer => (
                                        <div key={answer._id} className={`flex gap-6 p-8 rounded-3xl border transition-all ${answer.isAccepted
                                            ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-200/40'
                                            : 'bg-white border-slate-200'
                                            }`}>
                                            {/* Answer Voting */}
                                            <div className="flex flex-col items-center gap-2 text-slate-600">
                                                <button onClick={() => handleVoteAnswer(answer._id, 'up')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                </button>
                                                <span className="text-xl font-bold text-slate-700">
                                                    {(answer.votes?.up?.length || 0) - (answer.votes?.down?.length || 0)}
                                                </span>
                                                <button onClick={() => handleVoteAnswer(answer._id, 'down')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>

                                                {/* Accepted Checkmark */}
                                                {answer.isAccepted ? (
                                                    <div className="mt-4 text-emerald-600 flex flex-col items-center gap-1" title="Accepted Answer">
                                                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                        <span className="text-xs font-bold uppercase tracking-wide">Accepted</span>
                                                    </div>
                                                ) : (
                                                    isAuthor && (
                                                        <button onClick={() => handleAccept(answer._id)} className="mt-4 text-slate-500 hover:text-emerald-600 transition-colors" title="Mark as solution">
                                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            {/* Answer Content */}
                                            <div className="flex-1">
                                                <div className="prose prose-slate max-w-none mb-6 text-slate-700">
                                                    <ReactMarkdown>{answer.content}</ReactMarkdown>
                                                </div>

                                                <div className="flex items-center justify-between text-sm pt-6 border-t border-slate-200">
                                                    <div className="text-slate-500">
                                                        Answered {new Date(answer.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                                                        <img src={answer.author.avatar || `https://ui-avatars.com/api/?name=${answer.author.name}&background=e2e8f0&color=0f172a`} className="w-6 h-6 rounded-lg" />
                                                        <span className="font-bold text-cyan-700">{answer.author?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {post.comments?.map(comment => (
                                        <div key={comment._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-colors">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                                                    {comment.user?.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{comment.user?.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{new Date(comment.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed ml-14">{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Answer */}
                        <div className="mt-12 bg-gradient-to-br from-white to-slate-100 rounded-3xl border border-slate-200 p-8 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-cyan-200/40 rounded-full blur-[100px]"></div>

                            <h2 className="text-xl font-bold text-slate-900 mb-6 relative z-10">
                                {post.type === 'question' ? "Your Answer" : "Leave a Comment"}
                            </h2>
                            {auth?.user ? (
                                <form onSubmit={handleSubmitResponse} className="relative z-10">
                                    <textarea
                                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none font-mono text-sm bg-white text-slate-900 min-h-[150px] placeholder-slate-400"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={post.type === 'question' ? "Write your solution here (Markdown supported)..." : "Share your thoughts..."}
                                        required
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all"
                                        >
                                            {post.type === 'question' ? "Post Answer" : "Post Comment"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-slate-50 rounded-2xl p-10 text-center border border-dashed border-slate-200 relative z-10">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Join the conversation</h3>
                                    <p className="text-slate-600 mb-8 max-w-md mx-auto">Share your knowledge, ask questions, and connect with other developers.</p>
                                    <div className="flex justify-center gap-4">
                                        <Link to="/login" className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-colors">
                                            Log In
                                        </Link>
                                        <Link to="/signup" className="px-8 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                                            Sign Up
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="hidden lg:block"
                    >
                        {isAuthor && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Post Analytics</h3>
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500 leading-tight">Views</div>
                                        <div className="text-lg font-bold text-slate-900">{post.views || 0}</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500 leading-tight">Likes</div>
                                        <div className="text-lg font-bold text-slate-900">{post.likes?.length || 0}</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500 leading-tight">Saves</div>
                                        <div className="text-lg font-bold text-slate-900">{post.bookmarks?.length || 0}</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
                                        <div className="text-[11px] uppercase tracking-wide text-slate-500 leading-tight">Comment rate</div>
                                        <div className="text-lg font-bold text-slate-900">{commentRate}%</div>
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-4 leading-snug">
                                    Comment rate is based on {totalComments} responses.
                                </div>
                            </div>
                        )}

                        {post.type === 'question' && (
                            <div className="bg-gradient-to-br from-amber-100 to-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h3 className="font-bold text-orange-700 mb-4 flex items-center relative z-10">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    How to Answer
                                </h3>
                                <ul className="space-y-4 text-sm text-orange-700/80 relative z-10">
                                    <li className="flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 mr-3 flex-shrink-0"></span>
                                        Be specific and provide code examples.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 mr-3 flex-shrink-0"></span>
                                        Share only your own content or open source solutions.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 mr-3 flex-shrink-0"></span>
                                        Be respectful and helpful to others.
                                    </li>
                                </ul>
                            </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24 backdrop-blur-md">
                            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Related Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {(post.tags && post.tags.length > 0 ? post.tags : ['Development', 'Technology']).map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-cyan-100 hover:text-cyan-700 border border-transparent hover:border-cyan-200 transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {collectionModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Add to Collection</h3>
                                <p className="text-sm text-slate-600">Save this post into a playlist.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCollectionModalOpen(false)}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                X
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="New collection name"
                                    className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateCollection}
                                    disabled={creatingCollection}
                                    className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                                >
                                    {creatingCollection ? 'Creating...' : 'Create'}
                                </button>
                            </div>

                            {collectionsLoading ? (
                                <div className="py-6 text-center text-slate-500">Loading collections...</div>
                            ) : collections.length === 0 ? (
                                <div className="py-6 text-center text-slate-500">No collections yet. Create your first one.</div>
                            ) : (
                                <div className="space-y-3">
                                    {collections.map((collection) => {
                                        const hasPost = collection.posts?.some((item: any) => (typeof item === 'string' ? item : item._id) === post._id);
                                        return (
                                            <button
                                                key={collection._id}
                                                onClick={() => handleToggleCollection(collection._id)}
                                                className={`w-full text-left border rounded-xl px-4 py-3 flex items-center justify-between ${hasPost ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 hover:border-cyan-200'}`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-slate-900">{collection.name}</div>
                                                    <div className="text-xs text-slate-500">{(collection.posts || []).length} posts</div>
                                                </div>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${hasPost ? 'text-cyan-700' : 'text-slate-500'}`}>
                                                    {hasPost ? 'Added' : 'Add'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetail;
