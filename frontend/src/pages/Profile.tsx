import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/AppNavbar';
import ActivityTimeline from '../components/ActivityTimeline';
import { motion } from 'framer-motion';

type ProfileUser = {
    _id: string;
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    title?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    website?: string;
    socials?: {
        github?: string;
        linkedin?: string;
        leetcode?: string;
        stackoverflow?: string;
        medium?: string;
        twitter?: string;
    };
    skills?: string[];
    expertise?: Array<{ topic: string; level: string; endorsements: number }>;
    followers?: Array<{ _id: string; name: string; username?: string; avatar?: string }>;
    following?: Array<{ _id: string; name: string; username?: string; avatar?: string }>;
    learningStreak?: { current: number; longest: number };
    points?: number;
    badges?: string[];
    stats?: {
        joinedDaysAgo?: number;
        totalPosts?: number;
        totalLikes?: number;
    };
};

type RecentPost = {
    _id: string;
    title?: string;
    content?: string;
    createdAt?: string;
    views?: number;
    likes?: string[];
};

type ProfileResponse = {
    user: ProfileUser;
    recentPosts: RecentPost[];
    isFollowing?: boolean;
};

const Profile = () => {
    const { id } = useParams();
    const auth = useContext(AuthContext);
    const viewer = auth?.user;
    const navigate = useNavigate();
    const [data, setData] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'activity' | 'about' | 'network'>('posts');

    useEffect(() => {
        let cancelled = false;
        const cacheKey = id ? `ksp_profile_${id}` : '';
        let hasCache = false;

        const fetchProfile = async () => {
            if (!id) {
                setError('Missing user id.');
                setLoading(false);
                return;
            }

            if (cacheKey) {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (parsed?.data) {
                            hasCache = true;
                            setData(parsed.data);
                            setLoading(false);
                        }
                    } catch {
                        // ignore cache parse errors
                    }
                }
            }

            if (!hasCache) {
                setLoading(true);
            }
            setError(null);
            try {
                const res = await api.get<ProfileResponse>(`/users/${id}`);
                if (!cancelled) {
                    setData(res.data);
                    if (cacheKey) {
                        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: res.data }));
                    }
                }
            } catch (e: any) {
                const message =
                    e?.response?.data?.message ||
                    e?.message ||
                    'Failed to load profile.';
                if (!cancelled) setError(message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProfile();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const user = data?.user;
    const recentPosts = data?.recentPosts ?? [];

    const followerCount = user?.followers?.length ?? 0;
    const followingCount = user?.following?.length ?? 0;
    const isSelf = !!viewer && viewer._id === user?._id;
    const isFollowing = data?.isFollowing ?? (!!viewer && !!user?.followers?.some(f => f._id === viewer._id));

    const handleToggleFollow = async () => {
        if (!user) return;
        if (!viewer) {
            navigate('/login');
            return;
        }

        try {
            setFollowLoading(true);
            const res = await api.put(`/users/${user._id}/follow`);
            const nowFollowing = res.data?.isFollowing;

            setData(prev => {
                if (!prev) return prev;
                const currentFollowers = prev.user.followers || [];
                let nextFollowers = currentFollowers;

                if (nowFollowing) {
                    if (!currentFollowers.some(f => f._id === viewer._id)) {
                        nextFollowers = [
                            ...currentFollowers,
                            { _id: viewer._id, name: viewer.name, avatar: viewer.avatar }
                        ];
                    }
                } else {
                    nextFollowers = currentFollowers.filter(f => f._id !== viewer._id);
                }

                return {
                    ...prev,
                    isFollowing: nowFollowing,
                    user: {
                        ...prev.user,
                        followers: nextFollowers
                    }
                };
            });
        } catch (e) {
            console.error('Failed to toggle follow', e);
        } finally {
            setFollowLoading(false);
        }
    };

    const socialLinks = useMemo(() => [
        {
            type: 'github', url: user?.socials?.github, icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            )
        },
        {
            type: 'linkedin', url: user?.socials?.linkedin, icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            )
        },
        {
            type: 'twitter', url: user?.socials?.twitter, icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
            )
        }
    ].filter(link => link.url), [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <Navbar />
                <div className="pt-28 flex justify-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <Navbar />
                <div className="pt-28 px-4 flex justify-center">
                    <div className="glass-premium p-8 text-center max-w-md w-full">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">User not found</h2>
                        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-20">
            <Navbar />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hero Banner */}
            <div className="relative h-72 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/20" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-premium p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar */}
                        <div className="relative">
                            <motion.img
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=gradient&color=fff&size=256`}
                                className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl shadow-cyan-500/30 object-cover bg-gradient-to-br from-cyan-400 to-purple-500"
                                alt={user.name}
                            />
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-lg" title="Online now" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-cyan-600 to-purple-600 mb-2">
                                        {user.name}
                                    </h1>
                                    <p className="text-slate-600 font-semibold text-xl mb-3">
                                        {user.jobTitle || 'Member'} {user.company && <span className="text-slate-400">at {user.company}</span>}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                        {user.location && (
                                            <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full">
                                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {user.location}
                                            </div>
                                        )}
                                        {user.website && (
                                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full hover:bg-white transition-colors">
                                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                Website
                                            </a>
                                        )}
                                        {socialLinks.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                {socialLinks.map(link => (
                                                    <a
                                                        key={link.type}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-white/60 rounded-full hover:bg-white hover:text-cyan-600 transition-all hover:scale-110"
                                                        title={link.type}
                                                    >
                                                        {link.icon}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {isSelf ? (
                                        <Link to="/settings/profile" className="btn-secondary px-6 py-3 rounded-xl">
                                            Edit Profile
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={handleToggleFollow}
                                            disabled={followLoading}
                                            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-xl active:scale-95 ${isFollowing
                                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-2xl hover:shadow-cyan-500/40'
                                                }`}
                                        >
                                            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {user.bio && (
                                <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                                    {user.bio}
                                </p>
                            )}

                            {/* Stats Dashboard */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Reputation', value: user.points || 0, icon: '⭐', color: 'from-yellow-400 to-orange-500' },
                                    { label: 'Followers', value: followerCount, icon: '👥', color: 'from-cyan-400 to-blue-500' },
                                    { label: 'Following', value: followingCount, icon: '🔗', color: 'from-purple-400 to-pink-500' },
                                    { label: 'Day Streak', value: user.learningStreak?.current || 0, icon: '🔥', color: 'from-red-400 to-orange-500' }
                                ].map((stat, idx) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + idx * 0.1 }}
                                        className="glass-card p-4 text-center group hover:scale-105 transition-transform cursor-pointer"
                                    >
                                        <div className={`text-3xl mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent font-extrabold`}>
                                            {stat.icon}
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tabbed Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-2 mb-8 flex gap-2"
                >
                    {(['posts', 'activity', 'about', 'network'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab
                                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                                : 'text-slate-600 hover:bg-white/60'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </motion.div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        {/* Skills */}
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 mb-4 text-sm uppercase tracking-wider">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {(user.skills && user.skills.length > 0) ? user.skills.map(skill => (
                                    <span key={skill} className="px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-purple-50 text-slate-700 text-xs font-bold rounded-lg border border-cyan-200/50 hover:border-cyan-400 transition-colors">
                                        {skill}
                                    </span>
                                )) : (
                                    <span className="text-sm text-slate-500 italic">No skills added</span>
                                )}
                            </div>
                        </div>

                        {/* Badges */}
                        {user.badges && user.badges.length > 0 && (
                            <div className="glass-card p-6">
                                <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 mb-4 text-sm uppercase tracking-wider">Achievements</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {user.badges.map((_, idx) => (
                                        <div key={idx} className="aspect-square bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-pointer">
                                            🏆
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-2"
                    >
                        {activeTab === 'posts' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-900 text-2xl mb-6">Recent Activity</h3>
                                {recentPosts.length > 0 ? (
                                    recentPosts.map((post, idx) => (
                                        <motion.div
                                            key={post._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="glass-card p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all group"
                                        >
                                            <Link to={`/posts/${post._id}`} className="block">
                                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all mb-2">
                                                    {post.title}
                                                </h3>
                                                <p className="text-slate-600 text-sm line-clamp-2 mb-4">{post.content?.replace(/[#*`]/g, '')}</p>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {new Date(post.createdAt!).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        {post.views || 0} views
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                        {post.likes?.length || 0} likes
                                                    </span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="glass-card p-12 text-center">
                                        <div className="text-6xl mb-4">📝</div>
                                        <p className="text-slate-500 text-lg">No recent posts found.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="glass-card p-8">
                                <h3 className="font-bold text-slate-900 text-2xl mb-6">Activity Timeline</h3>
                                <ActivityTimeline userId={user._id} />
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="glass-card p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-6">About</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Full Name', value: user.name },
                                        { label: 'Username', value: `@${user.username || 'N/A'}` },
                                        { label: 'Company', value: user.company || 'N/A' },
                                        { label: 'Location', value: user.location || 'N/A' }
                                    ].map((field) => (
                                        <div key={field.label}>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{field.label}</label>
                                            <div className="text-slate-900 font-semibold text-lg">{field.value}</div>
                                        </div>
                                    ))}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bio</label>
                                        <div className="text-slate-900 leading-relaxed">{user.bio || 'No bio provided.'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'network' && (
                            <div className="glass-card p-8">
                                <h3 className="font-bold text-slate-900 text-2xl mb-6">Network</h3>
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Followers</h4>
                                        {user.followers?.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {user.followers.map(f => (
                                                    <Link to={`/users/${f._id}`} key={f._id} className="flex items-center gap-3 p-4 rounded-xl bg-white/60 hover:bg-white border border-slate-200/50 hover:border-cyan-300 transition-all hover:shadow-lg">
                                                        <img src={f.avatar || `https://ui-avatars.com/api/?name=${f.name}&background=gradient&color=fff`} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt={f.name} />
                                                        <div className="font-bold text-slate-900">{f.name}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm text-slate-500 italic">No followers yet.</p>}
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Following</h4>
                                        {user.following?.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {user.following.map(f => (
                                                    <Link to={`/users/${f._id}`} key={f._id} className="flex items-center gap-3 p-4 rounded-xl bg-white/60 hover:bg-white border border-slate-200/50 hover:border-cyan-300 transition-all hover:shadow-lg">
                                                        <img src={f.avatar || `https://ui-avatars.com/api/?name=${f.name}&background=gradient&color=fff`} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt={f.name} />
                                                        <div className="font-bold text-slate-900">{f.name}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm text-slate-500 italic">Not following anyone yet.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div >
        </div >
    );
};

export default Profile;
