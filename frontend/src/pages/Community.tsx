import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/AppNavbar';
import PollWidget from '../components/PollWidget';
import { AuthContext } from '../context/AuthContext';
import { ChatBubbleLeftRightIcon, UserGroupIcon, PlusIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/outline';

const Community = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;

    const [rooms, setRooms] = useState<any[]>([]);
    const [polls, setPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [roomsRes, pollsRes] = await Promise.all([
                api.get('/community/rooms'),
                api.get('/community/polls')
            ]);
            setRooms(roomsRes.data);
            setPolls(pollsRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreatePoll = async () => {
        if (!user) return alert('Login required');
        const question = prompt('Poll Question:');
        if (!question) return;
        const optionsStr = prompt('Options (comma separated):');
        if (!optionsStr) return;

        try {
            await api.post('/community/polls', {
                question,
                options: optionsStr.split(',').map(s => s.trim()),
                expiresAt: new Date(Date.now() + 86400000 * 7) // 7 days
            });
            fetchData();
        } catch (err) {
            alert('Failed to create poll');
        }
    };

    const handleCreateRoom = async () => {
        if (!user) return alert('Login required');
        const name = prompt('Room Name:');
        if (!name) return;
        const desc = prompt('Description:');
        const topics = prompt('Topics (comma separated):');

        try {
            await api.post('/community/rooms', {
                name,
                description: desc,
                topics: topics ? topics.split(',') : [],
                icon: '💬'
            });
            fetchData();
        } catch (err) {
            alert('Failed to create room');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-cyan-200 selection:text-slate-900">
            <Navbar forceWhite={true} />

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply"></div>
            </div>

            {/* Hero Section */}
            <div className="relative pt-32 pb-16 px-6 overflow-hidden z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-700 text-xs font-bold uppercase tracking-widest mb-4"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            <span>Global Network</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight"
                        >
                            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Hub</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-600 text-lg max-w-xl leading-relaxed"
                        >
                            Join thousands of developers worldwide. Discuss, share knowledge, and collaborate in real-time.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <button
                            onClick={handleCreateRoom}
                            className="group flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-cyan-50 transition-all shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-1"
                        >
                            <span className="bg-cyan-100 text-cyan-600 p-1.5 rounded-lg group-hover:bg-cyan-200 transition-colors">
                                <PlusIcon className="w-5 h-5" />
                            </span>
                            Create New Room
                        </button>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Chat Rooms (Main Content) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-cyan-600" />
                                    Active Discussions
                                </h2>
                                <span className="text-sm text-slate-600">{rooms.length} rooms live</span>
                            </div>

                            <div className="grid gap-4">
                                {rooms.map((room, index) => (
                                    <motion.div
                                        key={room._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            to={`/community/rooms/${room._id}`}
                                            className="block group relative bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200 hover:border-cyan-300/60 p-6 rounded-2xl transition-all duration-300 shadow-sm"
                                        >
                                            <div className="flex items-start gap-5">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-cyan-300 blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                                                        {room.icon || '💬'}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors truncate pr-4">{room.name}</h3>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                                            <UserGroupIcon className="w-3.5 h-3.5" />
                                                            {room.members?.length || 0}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 text-sm mt-1 mb-4 line-clamp-2 leading-relaxed">{room.description}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {room.topics.map((t: string) => (
                                                            <span key={t} className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-lg border border-cyan-200 group-hover:border-cyan-300 transition-colors">
                                                                #{t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="hidden sm:flex self-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar (Polls & Stats) */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* Polls Widget */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <FireIcon className="w-6 h-6 text-orange-500" />
                                    Hot Polls
                                </h2>
                                <div className="bg-white/80 border border-slate-200 rounded-3xl p-6 backdrop-blur-md shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md uppercase tracking-wider">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            Live Voting
                                        </span>
                                        <button onClick={handleCreatePoll} className="text-xs text-slate-600 hover:text-slate-900 font-bold transition-colors">
                                            + New Poll
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {polls.length === 0 && (
                                            <div className="text-center py-8">
                                                <p className="text-slate-500 text-sm">No active polls.</p>
                                                <button onClick={handleCreatePoll} className="text-cyan-600 text-sm font-bold mt-2 hover:underline">Start one?</button>
                                            </div>
                                        )}
                                        {polls.map(poll => (
                                            <div key={poll._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                                <PollWidget
                                                    poll={poll}
                                                    onVote={fetchData}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mini Stats or Info */}
                            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                <h3 className="text-lg font-bold mb-2 relative z-10">Premium Access</h3>
                                <p className="text-cyan-100 text-sm mb-4 relative z-10">Unlock private channels and priority support with a Pro account.</p>
                                <button className="w-full py-2 bg-white text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-lg relative z-10">
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;
