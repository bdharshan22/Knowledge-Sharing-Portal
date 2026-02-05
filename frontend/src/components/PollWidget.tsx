import { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface PollOption {
    _id: string;
    text: string;
    votes: string[];
}

interface Poll {
    _id: string;
    question: string;
    options: PollOption[];
    author?: { // Made optional to prevent crash
        name: string;
        avatar: string;
    };
    isActive: boolean;
}

interface PollWidgetProps {
    poll: Poll;
    onVote: () => void;
}

const PollWidget = ({ poll, onVote }: PollWidgetProps) => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const [loading, setLoading] = useState(false);

    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    const userVoteIndex = user ? poll.options.findIndex(opt => opt.votes.includes(user._id)) : -1;

    const handleVote = async (index: number) => {
        if (!user) return alert('Please login to vote');
        setLoading(true);
        try {
            await api.post(`/community/polls/${poll._id}/vote`, {
                optionIndex: index
            });
            onVote();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/70 rounded-2xl p-6 shadow-lg shadow-slate-200/60 hover:shadow-cyan-200/60 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{poll.question}</h3>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200 whitespace-nowrap ml-2">
                    by {poll.author?.name || 'Unknown'}
                </span>
            </div>

            <div className="space-y-4">
                {poll.options.map((option, idx) => {
                    const votes = option.votes.length;
                    const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                    const isSelected = userVoteIndex === idx;

                    return (
                        <button
                            key={idx}
                            onClick={() => handleVote(idx)}
                            disabled={loading}
                            className={`w-full relative overflow-hidden rounded-xl border text-left transition-all duration-300 group ${isSelected
                                ? 'border-cyan-500/50 shadow-lg shadow-cyan-200/40'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {/* Progress Bar Background */}
                            <div
                                className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${isSelected
                                    ? 'bg-gradient-to-r from-cyan-200/60 to-blue-200/60'
                                    : 'bg-slate-200/60'
                                    }`}
                                style={{ width: `${percentage}%` }}
                            ></div>

                            <div className="relative p-4 flex justify-between items-center z-10">
                                <span className={`font-medium transition-colors ${isSelected ? 'text-cyan-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                    {option.text}
                                </span>
                                <span className={`text-sm font-bold ${isSelected ? 'text-cyan-700' : 'text-slate-500'}`}>
                                    {percentage}%
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-4">
                <span>{totalVotes} votes total</span>
                {userVoteIndex !== -1 && (
                    <span className="text-cyan-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        Voted
                    </span>
                )}
            </div>
        </div>
    );
};

export default PollWidget;
