import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface LeaderboardUser {
    _id: string;
    name: string;
    avatar: string;
    reputation: number;
    badges: { name: string; icon: string }[];
    stats: {
        postsCount: number;
        answersCount: number;
    };
    rank: number;
}

const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('all');

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/leaderboard?period=${period}`);
            setUsers(res.data.leaderboard);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Hall of Fame</h1>
                <p className="text-gray-600">Top contributors making this community awesome.</p>
            </div>

            {/* Filters */}
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                    {['all', 'month', 'week'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${period === p
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'This Week'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reputation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Badges</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Contribs</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user, idx) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                idx === 2 ? 'bg-orange-100 text-orange-800' :
                                                    'text-gray-500'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link to={`/users/${user._id}`} className="flex items-center">
                                            <img className="h-10 w-10 rounded-full" src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 hover:text-indigo-600">{user.name}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{user.reputation}</div>
                                        <div className="text-xs text-gray-500">points</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                        <div className="flex -space-x-1 overflow-hidden">
                                            {user.badges.slice(0, 3).map((badge, bIdx) => (
                                                <span key={bIdx} title={badge.name} className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 ring-2 ring-white text-xs">
                                                    {badge.icon}
                                                </span>
                                            ))}
                                            {user.badges.length > 3 && (
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 ring-2 ring-white text-xs text-gray-500">
                                                    +{user.badges.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                        <div className="flex space-x-4">
                                            <span title="Posts">📝 {user.stats?.postsCount || 0}</span>
                                            <span title="Answers">💬 {user.stats?.answersCount || 0}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
