import { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/AppNavbar';
import { PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

const ChatRoom = () => {
    const { id } = useParams();
    const auth = useContext(AuthContext);
    const user = auth?.user;

    const [room, setRoom] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
    const [spotlightMessage, setSpotlightMessage] = useState<any | null>(null);
    const [spotlight, setSpotlight] = useState<any | null>(null);
    const [topContributors, setTopContributors] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isModerator = user && (user.role === 'admin' || user.role === 'moderator');

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/community/rooms/${id}`);
            setRoom(res.data);
            setMessages(res.data.messages || []);
            setPinnedMessages(res.data.pinnedMessages || []);
            setSpotlightMessage(res.data.spotlightMessage || null);
            setSpotlight(res.data.spotlight || null);
            setTopContributors(res.data.topContributors || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 3 seconds
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        // Auto scroll to bottom
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/community/rooms/${id}/messages`, {
                text: newMessage
            });
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleTogglePin = async (messageId: string) => {
        try {
            await api.put(`/community/rooms/${id}/pin/${messageId}`);
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSetSpotlight = async (messageId: string) => {
        try {
            const title = window.prompt('Spotlight title (optional):', '') || '';
            await api.post(`/community/rooms/${id}/spotlight`, { messageId, title });
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearSpotlight = async () => {
        try {
            await api.delete(`/community/rooms/${id}/spotlight`);
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleScrollToMessage = (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-cyan-200 selection:text-slate-900 flex flex-col">
            <Navbar forceWhite={true} />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
            </div>

            <div className="flex-1 pt-24 pb-6 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col h-screen">

                {/* Chat Container */}
                <div className="flex-1 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col relative z-10 animate-fade-in-up">

                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-slate-200 bg-white/80 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/community" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{room.icon}</span>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        {room.name}
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 text-[10px] uppercase font-bold tracking-wider border border-green-400/40">Live</span>
                                    </h1>
                                    <p className="text-sm text-slate-600 line-clamp-1">{room.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
                        {spotlightMessage && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Spotlight</div>
                                        <h3 className="text-lg font-bold text-slate-900">{spotlight?.title || 'Highlighted Insight'}</h3>
                                        <p className="text-slate-700 mt-2 line-clamp-2">{spotlightMessage.text}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleScrollToMessage(spotlightMessage._id)}
                                            className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700 hover:text-amber-800"
                                        >
                                            Jump to message
                                        </button>
                                    </div>
                                    {isModerator && (
                                        <button
                                            type="button"
                                            onClick={handleClearSpotlight}
                                            className="text-xs font-bold uppercase tracking-wide text-amber-700 border border-amber-200 bg-white/70 px-3 py-1 rounded-full hover:bg-white"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {pinnedMessages.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Pinned Messages</div>
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{pinnedMessages.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {pinnedMessages.map((msg) => (
                                        <div key={`pinned-${msg._id}`} className="flex items-start justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-600 mb-1">
                                                    {msg.user?.name || 'User'}
                                                </div>
                                                <p className="text-sm text-slate-700 line-clamp-2">{msg.text}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleScrollToMessage(msg._id)}
                                                    className="mt-2 text-[11px] font-bold uppercase tracking-wide text-cyan-700 hover:text-cyan-800"
                                                >
                                                    Jump to message
                                                </button>
                                            </div>
                                            {isModerator && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePin(msg._id)}
                                                    className="text-[11px] font-bold uppercase tracking-wide text-slate-600 border border-slate-200 px-2 py-1 rounded-full hover:bg-white"
                                                >
                                                    Unpin
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {topContributors.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Top Contributors</div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {topContributors.map((contrib: any, idx: number) => (
                                        <div key={`contrib-${contrib.user?._id || idx}`} className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {contrib.user?.avatar ? (
                                                    <img src={contrib.user.avatar} alt={contrib.user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-600">{contrib.user?.name?.[0] || 'U'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-800">{contrib.user?.name || 'User'}</div>
                                                <div className="text-xs text-slate-500">{contrib.count} messages</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-70">
                                <span className="text-4xl mb-2">👋</span>
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        )}
                        {messages.map((msg: any, idx) => {
                            const isMe = user && msg.user && msg.user._id === user._id;
                            const userName = msg.user ? msg.user.name : 'Unknown User';
                            const userAvatar = msg.user?.avatar || `https://ui-avatars.com/api/?name=${userName}&background=random`;
                            const isPinned = pinnedMessages.some((p) => String(p._id) === String(msg._id));
                            const isSpotlight = spotlight?.messageId ? String(spotlight.messageId) === String(msg._id) : false;

                            return (
                                <div key={idx} id={`message-${msg._id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                    {!isMe && (
                                        <img
                                            src={userAvatar}
                                            className="w-8 h-8 rounded-full mr-3 mt-1 border-2 border-slate-200 shadow-sm"
                                            alt={userName}
                                        />
                                    )}
                                    <div className={`max-w-[80%] md:max-w-[70%]`}>
                                        {!isMe && (
                                            <div className="text-xs font-bold text-slate-600 mb-1 ml-1 flex items-center gap-2">
                                                {userName}
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`px-5 py-3 shadow-md text-sm leading-relaxed ${isMe
                                            ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm backdrop-blur-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        {(isPinned || isSpotlight) && (
                                            <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                                {isPinned && <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">Pinned</span>}
                                                {isSpotlight && <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700">Spotlight</span>}
                                            </div>
                                        )}
                                        {isModerator && (
                                            <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePin(msg._id)}
                                                    className="px-2 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
                                                >
                                                    {isPinned ? 'Unpin' : 'Pin'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetSpotlight(msg._id)}
                                                    className="px-2 py-1 rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50"
                                                >
                                                    Spotlight
                                                </button>
                                            </div>
                                        )}
                                        {isMe && (
                                            <div className="text-[10px] text-slate-500 mt-1 text-right mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/80 border-t border-slate-200 backdrop-blur-md">
                        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-300 rounded-2xl pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3.5 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                            >
                                <PaperAirplaneIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
