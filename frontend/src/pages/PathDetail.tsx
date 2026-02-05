import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/AppNavbar';
import { motion } from 'framer-motion';

interface Step {
    _id: string;
    title: string;
    post: {
        _id: string;
        title: string;
        type: string;
    };
    isOptional: boolean;
}

interface Module {
    _id: string;
    title: string;
    steps: Step[];
}

interface LearningPath {
    _id: string;
    title: string;
    description: string;
    modules: Module[];
    author: {
        name: string;
        avatar: string;
    };
}

interface LearningStreak {
    current: number;
    longest: number;
    lastStudyDate?: string;
}

interface LearningReminders {
    enabled: boolean;
    time: string;
    daysOfWeek: number[];
}

const PathDetail = () => {
    const { id } = useParams();
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const [path, setPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolled, setEnrolled] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [milestones, setMilestones] = useState<number[]>([]);
    const [streak, setStreak] = useState<LearningStreak | null>(null);
    const [reminders, setReminders] = useState<LearningReminders>({
        enabled: false,
        time: '09:00',
        daysOfWeek: []
    });
    const [updatingStep, setUpdatingStep] = useState<string | null>(null);
    const [reminderSaving, setReminderSaving] = useState(false);

    useEffect(() => {
        const fetchPath = async () => {
            try {
                const res = await api.get(`/learning-paths/${id}`);
                setPath(res.data);

                if (user) {
                    const userRes = await api.get(`/users/${user._id}`);
                    const profile = userRes.data.user;
                    const enrollment = profile.enrolledPaths?.find((p: any) => String(p.path?._id || p.path) === String(id));

                    if (enrollment) {
                        setEnrolled(true);
                        setProgress(enrollment.progress);
                        setCompletedSteps(enrollment.completedSteps);
                        setMilestones(enrollment.milestones || []);
                    }

                    if (profile.learningStreak) {
                        setStreak(profile.learningStreak);
                    }

                    const learningReminders = profile.preferences?.learningReminders;
                    if (learningReminders) {
                        setReminders({
                            enabled: !!learningReminders.enabled,
                            time: learningReminders.time || '09:00',
                            daysOfWeek: learningReminders.daysOfWeek || []
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching path:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPath();
    }, [id, user]);

    const handleEnroll = async () => {
        try {
            await api.post(`/learning-paths/${id}/enroll`);
            setEnrolled(true);
            setProgress(0);
            setCompletedSteps([]);
            setMilestones([]);
        } catch (err) {
            console.error('Error enrolling:', err);
            alert('Failed to enroll');
        }
    };

    const handleMarkComplete = async (stepId: string) => {
        if (!enrolled) {
            alert('Enroll to start tracking progress.');
            return;
        }

        try {
            setUpdatingStep(stepId);
            const { data } = await api.put(`/learning-paths/${id}/progress`, { stepId });
            setProgress(data.progress || 0);
            setCompletedSteps(data.completedSteps || []);
            setMilestones(data.milestones || []);
            if (data.streak) {
                setStreak(data.streak);
            }
        } catch (err) {
            console.error('Error updating progress:', err);
            alert('Failed to update progress');
        } finally {
            setUpdatingStep(null);
        }
    };

    const toggleReminderDay = (day: number) => {
        setReminders(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    const handleSaveReminders = async () => {
        try {
            setReminderSaving(true);
            const { data } = await api.put('/users/reminders', reminders);
            if (data?.learningReminders) {
                setReminders(data.learningReminders);
            }
        } catch (err) {
            console.error('Failed to save reminders', err);
            alert('Failed to save reminders');
        } finally {
            setReminderSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!path) return <div>Path not found</div>;

    const totalSteps = path.modules.reduce((acc, m) => acc + m.steps.length, 0);
    const milestoneTargets = [25, 50, 75, 100];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar forceWhite={true} />

            {/* Header / Hero */}
            <div className="relative bg-slate-100 pt-32 pb-24 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-slate-100 to-white opacity-95"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Link to="/learning-paths" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Paths
                            </Link>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6 leading-tight">
                            {path.title}
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-3xl leading-relaxed">
                            {path.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-8 text-sm text-slate-600 mb-8">
                            <div className="flex items-center bg-white/80 px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3 text-xs">
                                    {path.author.name[0]}
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider font-semibold text-slate-600">Instructor</span>
                                    <span className="font-bold text-slate-900">{path.author.name}</span>
                                </div>
                            </div>

                            <div className="flex items-center bg-white/80 px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider font-semibold text-slate-600">Modules</span>
                                    <span className="font-bold text-slate-900">{path.modules.length} Modules - {totalSteps} Steps</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Card */}
                        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 md:flex justify-between items-center shadow-sm">
                            <div className="flex-1 mb-6 md:mb-0">
                                {enrolled ? (
                                    <>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-indigo-700 font-medium">Your Progress</span>
                                            <span className="text-2xl font-bold text-slate-900">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3">
                                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-1">Ready to start?</h3>
                                        <p className="text-slate-600 text-sm">Enroll now to track your progress and earn badges.</p>
                                    </div>
                                )}
                            </div>

                            <div className="md:ml-8">
                                {enrolled ? (
                                    <button className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/60 flex items-center justify-center">
                                        Continue Learning
                                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/60 flex items-center justify-center"
                                    >
                                        Enroll Now (Free)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Momentum & Reminders */}
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Learning Momentum</h4>
                                        <p className="text-slate-600 text-sm mt-1">Keep your streak going and unlock milestones.</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c2.761 2.073 4 4.536 4 7.5 0 2.5-1 4-2 5l2 1c-1.5 2.5-4.5 4-7 4a6 6 0 01-6-6c0-2 1-3.5 3-5.5 1.5-1.5 2-3 2-5 2 1 3 3 3 5 0-2.5 1-4.5 1-6z" /></svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Current Streak</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">{streak?.current || 0} days</div>
                                        <div className="text-xs text-slate-500 mt-1">Longest: {streak?.longest || 0} days</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Last Activity</div>
                                        <div className="text-lg font-bold text-slate-900 mt-1">
                                            {streak?.lastStudyDate ? new Date(streak.lastStudyDate).toLocaleDateString() : 'Not yet'}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">Stay consistent to grow your streak.</div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Milestones</div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {milestoneTargets.map((target) => {
                                                const achieved = milestones.includes(target);
                                                return (
                                                    <span
                                                        key={`milestone-${target}`}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${achieved
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            : 'bg-white text-slate-500 border-slate-200'
                                                            }`}
                                                    >
                                                        {target}%
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Reminders</h4>
                                        <p className="text-slate-600 text-sm mt-1">Set a time to keep learning.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReminders(prev => ({ ...prev, enabled: !prev.enabled }))}
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${reminders.enabled ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                                    >
                                        {reminders.enabled ? 'On' : 'Off'}
                                    </button>
                                </div>

                                <div className={`mt-4 space-y-4 ${reminders.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Time</label>
                                        <input
                                            type="time"
                                            value={reminders.time}
                                            onChange={(e) => setReminders(prev => ({ ...prev, time: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Days</div>
                                        <div className="flex flex-wrap gap-2">
                                            {dayLabels.map((label, idx) => {
                                                const active = reminders.daysOfWeek.includes(idx);
                                                return (
                                                    <button
                                                        key={`day-${label}`}
                                                        type="button"
                                                        onClick={() => toggleReminderDay(idx)}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${active
                                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                                            : 'bg-white text-slate-500 border-slate-200'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveReminders}
                                    disabled={reminderSaving}
                                    className="mt-5 w-full btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
                                >
                                    {reminderSaving ? 'Saving...' : 'Save Reminders'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Curriculum Section */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-10">
                <div className="space-y-8">
                    {path.modules.map((module, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center">
                                    <span className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold mr-3 shadow-sm">
                                        {idx + 1}
                                    </span>
                                    {module.title}
                                </h3>
                                <span className="text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
                                    {module.steps.length} steps
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {module.steps.map((step, sIdx) => {
                                    const isCompleted = completedSteps.includes(step.post?._id);
                                    return (
                                        <div key={sIdx} className="p-6 flex items-center hover:bg-slate-50/80 transition-colors group">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-5 transition-all ${isCompleted
                                                ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20'
                                                : enrolled ? 'border-slate-300 text-transparent group-hover:border-indigo-400' : 'border-slate-200 text-slate-200'
                                                }`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/posts/${step.post?._id}`}
                                                    className={`text-base font-semibold block transition-colors ${isCompleted ? 'text-slate-900' : 'text-slate-700 group-hover:text-indigo-700'
                                                        }`}
                                                >
                                                    {step.title}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${step.post?.type === 'article' ? 'bg-blue-50 text-blue-600' :
                                                        step.post?.type === 'video' ? 'bg-red-50 text-red-600' :
                                                            'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {step.post?.type || 'Lesson'}
                                                    </span>
                                                    {step.isOptional && <span className="text-xs text-slate-400 italic">Optional</span>}
                                                </div>
                                            </div>

                                            <div className="ml-4 flex items-center gap-2">
                                                {enrolled && !isCompleted && (
                                                    <Link
                                                        to={`/posts/${step.post?._id}`}
                                                        className="inline-flex items-center px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        Start <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </Link>
                                                )}
                                                {enrolled && !isCompleted && (
                                                    <button
                                                        type="button"
                                                        onClick={() => step.post?._id && handleMarkComplete(step.post._id)}
                                                        disabled={updatingStep === step.post?._id}
                                                        className="inline-flex items-center px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
                                                    >
                                                        {updatingStep === step.post?._id ? 'Saving...' : 'Mark Complete'}
                                                    </button>
                                                )}
                                                {enrolled && isCompleted && (
                                                    <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-green-700 bg-green-50 rounded-full border border-green-100">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PathDetail;
