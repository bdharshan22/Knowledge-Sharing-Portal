import { Link } from 'react-router-dom';

interface PostCardProps {
    post: {
        _id: string;
        title: string;
        content: string;
        excerpt?: string;
        author: { _id: string; name: string };
        createdAt: string;
        likes: string[];
        comments: any[];
        views: number;
        type: string;
        tags?: string[];
        answers?: any[];
        acceptedAnswer?: string;
    };
}

const PostCard = ({ post }: PostCardProps) => {
    // const auth = useContext(AuthContext); // Can be used for like/save logic if needed inline
    const answerCount = post.answers?.length || 0;
    const voteCount = post.likes.length; // Simplified vote count (likes array length)

    const isAnswered = answerCount > 0;
    const hasAccepted = !!post.acceptedAnswer;

    return (
        <div className="flex border-b border-gray-200 p-4 pl-0">
            {/* Stats Column */}
            <div className="flex flex-col items-end gap-1.5 mr-4 min-w-[60px] text-xs sm:min-w-[100px] sm:flex-row sm:items-center sm:gap-4 sm:justify-start sm:w-auto sm:mr-0 sm:flex-col sm:items-end">
                <div className="text-gray-700 font-medium">
                    {voteCount} <span className="font-normal text-gray-500">votes</span>
                </div>

                <div className={`
                    rounded px-2 py-0.5 
                    ${hasAccepted ? 'bg-green-600 text-white border border-green-600' :
                        isAnswered ? 'text-green-700 border border-green-600' : 'text-gray-500'}
                `}>
                    {answerCount} <span className="font-normal">answers</span>
                </div>

                <div className="text-brown-500 text-gray-500">
                    {post.views} <span className="font-normal">views</span>
                </div>
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 ml-2 sm:ml-4">
                <h3 className="text-blue-600 font-medium text-[17px] mb-1 line-clamp-2 leading-snug">
                    <Link to={`/posts/${post._id}`} className="hover:text-blue-800 visited:text-indigo-900">
                        {post.title}
                    </Link>
                </h3>

                <div className="text-[13px] text-gray-700 mb-2 line-clamp-2 break-words">
                    {/* Using a simpler text truncation for performance, purely CSS line-clamp above handles visual */}
                    {post.excerpt || post.content.replace(/[#*`]/g, '').substring(0, 200) + '...'}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-y-2 mt-auto">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                        {post.tags?.map((tag) => (
                            <Link
                                key={tag}
                                to={`/tags/${tag}`}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs border border-transparent hover:border-blue-200 transition-colors"
                            >
                                {tag}
                            </Link>
                        )) || (
                                // Fallback tags if none (mock)
                                // In real app, we should ensure tags exist or hide this
                                ['javascript', 'react'].map(tag => (
                                    <Link
                                        key={tag}
                                        to={`/tags/${tag}`}
                                        className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs border border-transparent hover:border-blue-200 transition-colors"
                                    >
                                        {tag}
                                    </Link>
                                ))
                            )}
                    </div>

                    {/* Meta User Info */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
                        <Link to={`/users/${post.author?._id}`} className="flex items-center gap-1 hover:text-blue-600">
                            {/* Avatar (optional, can be text only for cleaner look like some SO views) */}
                            <span className="text-blue-600">{post.author?.name || 'Anonymous'}</span>
                        </Link>
                        <span className="font-bold text-gray-400">•</span>
                        <span>asked {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
