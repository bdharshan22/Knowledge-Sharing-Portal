import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Navbar from '../components/AppNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const DRAFT_KEY = 'ksp_post_draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const CreatePost = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Development',
        tags: '',
        difficulty: 'Beginner',
        visibility: 'public',
        type: 'article'
    });

    const [attachments, setAttachments] = useState<{ name: string, url: string, type: string, size: number }[]>([]);

    // Check for existing draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.title || draft.content) {
                    setShowDraftModal(true);
                }
            } catch (error) {
                console.error('Failed to parse draft', error);
            }
        }
    }, []);

    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (!formData.title && !formData.content) return;

        const autoSaveTimer = setInterval(() => {
            saveDraft();
        }, AUTO_SAVE_INTERVAL);

        return () => clearInterval(autoSaveTimer);
    }, [formData]);

    const saveDraft = () => {
        const draft = {
            ...formData,
            attachments,
            timestamp: Date.now()
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
    };

    const restoreDraft = () => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setFormData({
                    title: draft.title || '',
                    content: draft.content || '',
                    category: draft.category || 'Development',
                    tags: draft.tags || '',
                    difficulty: draft.difficulty || 'Beginner',
                    visibility: draft.visibility || 'public',
                    type: draft.type || 'article'
                });
                setAttachments(draft.attachments || []);
                setLastSaved(new Date(draft.timestamp));
            } catch (error) {
                console.error('Failed to restore draft', error);
            }
        }
        setShowDraftModal(false);
    };

    const discardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setShowDraftModal(false);
    };

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setLastSaved(null);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const insertMarkdown = (syntax: string, placeholder: string = '') => {
        const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = formData.content.substring(start, end) || placeholder;
        const before = formData.content.substring(0, start);
        const after = formData.content.substring(end);

        let newText = '';
        let cursorPos = start;

        if (syntax === 'bold') {
            newText = `${before}**${selectedText}**${after}`;
            cursorPos = start + 2 + selectedText.length;
        } else if (syntax === 'italic') {
            newText = `${before}_${selectedText}_${after}`;
            cursorPos = start + 1 + selectedText.length;
        } else if (syntax === 'code') {
            newText = `${before}\`${selectedText}\`${after}`;
            cursorPos = start + 1 + selectedText.length;
        } else if (syntax === 'link') {
            newText = `${before}[${selectedText}](url)${after}`;
            cursorPos = start + selectedText.length + 3;
        } else if (syntax === 'heading') {
            newText = `${before}## ${selectedText}${after}`;
            cursorPos = start + 3 + selectedText.length;
        } else if (syntax === 'list') {
            newText = `${before}- ${selectedText}${after}`;
            cursorPos = start + 2 + selectedText.length;
        } else if (syntax === 'codeblock') {
            newText = `${before}\n\`\`\`\n${selectedText}\n\`\`\`\n${after}`;
            cursorPos = start + 5 + selectedText.length;
        }

        setFormData({ ...formData, content: newText });
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        await uploadFile(e.target.files[0]);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            await uploadFile(e.dataTransfer.files[0]);
        }
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const { data } = await api.post('/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setAttachments(prev => [...prev, {
                name: data.name,
                url: data.url,
                type: data.type,
                size: data.size
            }]);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const postData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                attachments
            };

            const { data } = await api.post('/posts', postData);
            clearDraft(); // Clear draft after successful post
            toast.success('Post published successfully! 🎉');
            navigate(`/posts/${data._id}?refresh=true`);
        } catch (error) {
            console.error('Create post failed', error);
            toast.error('Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const wordCount = formData.content.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-20">
            <Navbar />

            {/* Animated Background Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="pt-28 px-4 max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-cyan-600 to-purple-600 mb-2">
                                Create New Post
                            </h1>
                            <p className="text-slate-600 text-lg">Share your knowledge with the community</p>
                        </div>
                        {/* Auto-save Indicator */}
                        {lastSaved && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-medium">
                                    Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Draft Restoration Modal */}
                <AnimatePresence>
                    {showDraftModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowDraftModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="glass-premium p-8 max-w-md w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Draft Found</h3>
                                    <p className="text-slate-600">
                                        We found a saved draft. Would you like to continue where you left off?
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={discardDraft}
                                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={restoreDraft}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
                                    >
                                        Restore Draft
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-premium p-6"
                    >
                        <label className="block text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 mb-3 uppercase tracking-wide">
                            Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-white/50 border-2 border-slate-200/70 rounded-2xl px-6 py-4 text-slate-900 text-xl font-semibold placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none"
                            placeholder="Enter an engaging title..."
                            required
                        />
                    </motion.div>

                    {/* Metadata Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4"
                    >
                        <div className="glass-card p-4">
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                            >
                                <option value="Development">Development</option>
                                <option value="Design">Design</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Business">Business</option>
                                <option value="Machine Learning">Machine Learning</option>
                            </select>
                        </div>

                        <div className="glass-card p-4">
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Difficulty</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        <div className="glass-card p-4">
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Visibility</label>
                            <select
                                name="visibility"
                                value={formData.visibility}
                                onChange={handleChange}
                                className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                                <option value="followers">Followers Only</option>
                            </select>
                        </div>

                        <div className="glass-card p-4">
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Post Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                            >
                                <option value="article">Article</option>
                                <option value="question">Question</option>
                                <option value="announcement">Announcement</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Editor Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-premium p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 uppercase tracking-wide">
                                Content
                            </label>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">
                                    {wordCount} words · {readingTime} min read
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                                >
                                    {showPreview ? 'Edit' : 'Preview'}
                                </button>
                            </div>
                        </div>

                        {/* Formatting Toolbar */}
                        {!showPreview && (
                            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 rounded-xl mb-4 border border-slate-200/70">
                                <button type="button" onClick={() => insertMarkdown('bold', 'bold text')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="Bold">
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('italic', 'italic text')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="Italic">
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('code', 'code')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="Inline Code">
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </button>
                                <div className="w-px h-6 bg-slate-300" />
                                <button type="button" onClick={() => insertMarkdown('heading', 'Heading')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="Heading">
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-cyan-600">H</span>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('list', 'List item')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="List">
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('link', 'link text')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="Link">
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </button>
                                <button type="button" onClick={() => insertMarkdown('codeblock', 'code block')} className="p-2 hover:bg-white rounded-lg transition-colors group" title="Code Block">
                                    <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Editor/Preview */}
                        <AnimatePresence mode="wait">
                            {showPreview ? (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="prose prose-slate max-w-none bg-white/50 rounded-2xl p-8 border-2 border-slate-200/70 min-h-[400px]"
                                >
                                    <ReactMarkdown>{formData.content || '*No content yet. Start writing!*'}</ReactMarkdown>
                                </motion.div>
                            ) : (
                                <motion.textarea
                                    key="editor"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={16}
                                    className="w-full bg-white/50 border-2 border-slate-200/70 rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none font-mono text-sm leading-relaxed resize-none"
                                    placeholder="Write your post content here using Markdown...

**Bold text**, *italic text*, `code`, [links](url)

## Headings
- Lists
```code blocks```"
                                    required
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Tags */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-6"
                    >
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Tags</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                            placeholder="e.g., react, typescript, webdev (comma separated)"
                        />
                    </motion.div>

                    {/* File Upload */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-6"
                    >
                        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Attachments</label>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging
                                ? 'border-cyan-400 bg-cyan-50/50'
                                : 'border-slate-300 bg-slate-50/50 hover:border-cyan-300'
                                }`}
                        >
                            <svg className="w-12 h-12 mx-auto mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-slate-600 mb-2">Drag and drop files here, or</p>
                            <label className="cursor-pointer inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                                {uploading ? 'Uploading...' : 'Browse Files'}
                                <input type="file" onChange={handleFileChange} className="hidden" disabled={uploading} />
                            </label>
                            <p className="text-slate-500 text-sm mt-2">Supports PDF, Images, Video</p>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white/80 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-br from-cyan-100 to-purple-100 rounded-lg">
                                                <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">{file.name}</div>
                                                <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-end gap-4 pt-6"
                    >
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveDraft}
                            className="px-8 py-3 bg-white border-2 border-cyan-500 text-cyan-600 font-bold rounded-xl hover:bg-cyan-50 transition-colors"
                        >
                            Save Draft
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="btn-primary px-10 py-4 text-lg shadow-2xl shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Publishing...
                                </span>
                            ) : 'Publish Post'}
                        </button>
                    </motion.div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
