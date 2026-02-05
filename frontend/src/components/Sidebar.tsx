import { Link, useLocation } from 'react-router-dom';
import { GlobeAltIcon, TagIcon, UsersIcon, BookmarkIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path ? 'bg-gray-100 text-black font-bold border-r-4 border-orange-400' : 'text-gray-600 hover:text-black hover:bg-gray-50';
    };

    return (
        <div className="w-[164px] hidden md:block pt-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto border-r border-gray-100 text-[13px]">
            <nav className="flex flex-col gap-1">
                <Link
                    to="/"
                    className={`block px-2 py-2 mb-2 ${isActive('/')}`}
                >
                    Home
                </Link>

                <div className="px-2 mb-1 text-xs font-bold text-gray-400 uppercase">
                    Public
                </div>

                <Link
                    to="/"
                    className={`flex items-center gap-2 px-2 py-2 ${isActive('/questions')}`}
                >
                    <GlobeAltIcon className="h-4 w-4" />
                    <span>Questions</span>
                </Link>

                <Link
                    to="/tags"
                    className={`flex items-center gap-2 px-2 py-2 ${isActive('/tags')}`}
                >
                    <TagIcon className="h-4 w-4" />
                    <span>Tags</span>
                </Link>

                <Link
                    to="/users"
                    className={`flex items-center gap-2 px-2 py-2 ${isActive('/users')}`}
                >
                    <UsersIcon className="h-4 w-4" />
                    <span>Users</span>
                </Link>

                <div className="mt-4 px-2 mb-1 text-xs font-bold text-gray-400 uppercase">
                    Collectives
                </div>
                <Link
                    to="/bookmarks"
                    className={`flex items-center gap-2 px-2 py-2 ${isActive('/bookmarks')}`}
                >
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Bookmarks</span>
                </Link>
            </nav>
        </div>
    );
};

export default Sidebar;
