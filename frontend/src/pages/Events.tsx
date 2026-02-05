import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import Navbar from '../components/AppNavbar';
import { AuthContext } from '../context/AuthContext';
import { CalendarIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    link: string;
    type: string;
    host: {
        name: string;
        avatar: string;
    };
    attendees: string[];
}

const Events = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleRegister = async (eventId: string, isRegistered: boolean) => {
        if (!user) return alert('Please login to register');
        try {
            const method = isRegistered ? 'delete' : 'post';
            await api({
                method,
                url: `/events/${eventId}/register`,
            });
            fetchEvents();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200 selection:text-slate-900">
            <Navbar forceWhite={true} />

            {/* Hero */}
            <div className="relative pt-24 pb-16 px-6 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-100 to-indigo-100 blur-[120px] opacity-60 rounded-full pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-4"
                    >
                        Community Events
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-slate-900"
                    >
                        Connect. Learn. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">Grow Together.</span>
                    </motion.h1>
                </div>
            </div>

            {/* Events List */}
            <div className="max-w-5xl mx-auto px-6 pb-24">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading events...</div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event, index) => {
                            const isRegistered = user && event.attendees.includes(user._id);
                            const eventDate = new Date(event.date);
                            const isLive = new Date() >= eventDate && new Date() <= new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Mock "Live" if within 2 hours

                            return (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white border border-slate-200 rounded-2xl p-6 md:p-8 hover:border-indigo-300/60 transition-colors flex flex-col md:flex-row gap-8 items-start relative overflow-hidden shadow-sm"
                                >
                                    {/* Date Column */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-slate-100 rounded-xl border border-slate-200">
                                        <span className="text-xs font-bold uppercase text-slate-500">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-3xl font-bold text-slate-900">{eventDate.getDate()}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            {isLive && (
                                                <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                                                </span>
                                            )}
                                            <span className="text-indigo-600 text-xs font-bold uppercase tracking-wide">{event.type}</span>
                                            <span className="text-slate-500 text-xs flex items-center gap-1">
                                                <CalendarIcon className="w-3 h-3" />
                                                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-2xl">
                                            {event.description}
                                        </p>

                                        <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <img src={event.host.avatar || 'https://www.gravatar.com/avatar?d=mp'} alt="" className="w-6 h-6 rounded-full ring-2 ring-slate-200" />
                                                <span className="text-slate-700">By {event.host.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <VideoCameraIcon className="w-4 h-4" />
                                                Virtual
                                            </div>
                                            <div>
                                                {event.attendees.length} attending
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex flex-col items-end gap-3 min-w-[150px] mt-4 md:mt-0">
                                        {isRegistered ? (
                                            <button
                                                onClick={() => handleRegister(event._id, true)}
                                                className="w-full bg-green-50 text-green-700 border border-green-200 py-2.5 rounded-lg font-bold text-sm hover:bg-green-100 transition-colors"
                                            >
                                                Registered
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRegister(event._id, false)}
                                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors"
                                            >
                                                Register Now
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;
