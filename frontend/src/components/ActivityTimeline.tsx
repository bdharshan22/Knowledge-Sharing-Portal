import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

interface Activity {
    _id: string;
    type: 'post' | 'comment' | 'follow' | 'badge';
    title: string;
    excerpt?: string;
    timestamp: string;
    data?: any;
}

interface ActivityTimelineProps {
    userId: string;
}

const ActivityTimeline = ({ userId }: ActivityTimelineProps) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = async (pageNum: number) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/users/${userId}/activity`, {
                params: { page: pageNum, limit: 10 }
            });

            if (data.activities.length < 10) {
                setHasMore(false);
            }

            if (pageNum === 1) {
                setActivities(data.activities);
            } else {
                setActivities(prev => [...prev, ...data.activities]);
            }
        } catch (err) {
            setError('Failed to load activity feed');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchActivities(1);
    }, [userId]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchActivities(nextPage);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return 'This Week';
        if (diffDays < 30) return 'This Month';
        return 'Older';
    };

    // Group activities by date
    const groupedActivities = activities.reduce((groups, activity) => {
        const dateGroup = formatDate(activity.timestamp);
        if (!groups[dateGroup]) {
            groups[dateGroup] = [];
        }
        groups[dateGroup].push(activity);
        return groups;
    }, {} as Record<string, Activity[]>);

    // Sort groups order
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

    if (loading && page === 1) {
        return (
            <div className="space-y-4 py-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                        <div className="w-12 flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-slate-200 mb-2"></div>
                            <div className="w-0.5 flex-1 bg-slate-100"></div>
                        </div>
                        <div className="flex-1 space-y-2 pb-8">
                            <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                            <div className="h-20 w-full bg-slate-100 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-8">{error}</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4">
                    <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-slate-900 font-bold">No activity yet</h3>
                <p className="text-slate-500 text-sm mt-1">This user hasn't posted or commented recently.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            {groupOrder.map(group => {
                const groupItems = groupedActivities[group];
                if (!groupItems) return null;

                return (
                    <div key={group} className="mb-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 sticky top-20 bg-slate-50/95 backdrop-blur py-2 z-10 w-fit px-2 rounded-lg border border-transparent shadow-sm">
                            {group}
                        </h3>
                        <div className="space-y-0">
                            {groupItems.map((activity, idx) => (
                                <motion.div
                                    key={activity._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="relative flex gap-6 pb-12 last:pb-0 group"
                                >
                                    {/* Timeline Line */}
                                    <div className="absolute left-6 top-8 bottom-0 w-px bg-slate-200 group-last:hidden" />

                                    {/* Icon */}
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-slate-50 shadow-sm transition-transform group-hover:scale-110 ${activity.type === 'post'
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                            : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                            }`}>
                                            <span className="text-lg text-white">
                                                {activity.type === 'post' ? '📝' : '💬'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 min-w-0">
                                        <div className="glass-card p-5 rounded-2xl hover:shadow-md transition-shadow border border-slate-200/60 bg-white/60">
                                            <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                                                <span className="font-semibold text-slate-700 capitalize">
                                                    {activity.type === 'post' ? 'Published a post' : 'Commented'}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            <h4 className="text-base font-bold text-slate-800 mb-2">
                                                <Link
                                                    to={`/posts/${activity.data?.postId || activity._id}`}
                                                    className="hover:text-cyan-600 transition-colors"
                                                >
                                                    {activity.title.replace('Commented on: ', '')}
                                                </Link>
                                            </h4>

                                            {activity.excerpt && (
                                                <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-2">
                                                    "{activity.excerpt}"
                                                </p>
                                            )}

                                            {activity.type === 'post' && (
                                                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                    {activity.data?.views > 0 && <span>👁️ {activity.data.views.toLocaleString()}</span>}
                                                    {activity.data?.likes > 0 && <span>❤️ {activity.data.likes}</span>}
                                                    {activity.data?.comments > 0 && <span>💬 {activity.data.comments}</span>}
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 lowercase">
                                                        {activity.data?.category}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {hasMore && (
                <div className="text-center mt-8 pt-8 border-t border-slate-200">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-cyan-200 transition-all shadow-sm"
                    >
                        {loading ? 'Loading...' : 'Show Older Activity'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityTimeline;
