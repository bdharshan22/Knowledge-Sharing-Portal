import { Link, useNavigate } from 'react-router-dom';
// Navbar Component
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
    forceWhite?: boolean;
}

const Navbar = ({ forceWhite }: NavbarProps) => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const logout = auth?.logout || (() => { });
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isModerator = user && (user.role === 'admin' || user.role === 'moderator');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || forceWhite
                ? 'glass-premium h-16 shadow-xl shadow-slate-300/30 border-b border-slate-200/50'
                : 'bg-white/40 backdrop-blur-sm h-20'
                }`}
        >
            {/* Animated gradient bar on top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'
                }`} />

            <div className="w-full px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between relative">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 group relative">
                    <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 group-hover:scale-110 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative z-10">K</span>
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all duration-300">
                        Knowledge<span className="text-gradient">Portal</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <div className="flex items-center space-x-6 text-sm font-semibold text-slate-600">
                        <Link to="/learning-paths" className="relative group hover:text-slate-900 transition-colors">
                            <span className="relative z-10">Learning Paths</span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link to="/projects" className="relative group hover:text-slate-900 transition-colors">
                            <span className="relative z-10">Project Gallery</span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link to="/events" className="relative group hover:text-slate-900 transition-colors">
                            <span className="relative z-10">Events</span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link to="/community" className="relative group hover:text-slate-900 transition-colors">
                            <span className="relative z-10">Community</span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        {isModerator && (
                            <Link to="/moderation" className="relative group hover:text-slate-900 transition-colors">
                                <span className="relative z-10">Moderation</span>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 group-hover:w-full transition-all duration-300" />
                            </Link>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200"></div>

                    {user ? (
                        <div className="flex items-center space-x-4">
                            <Link to="/create-post" className="relative text-slate-500 hover:text-cyan-600 transition-all p-2.5 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-purple-50 rounded-xl group">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </Link>

                            <div className="relative group">
                                <button className="flex items-center space-x-2 focus:outline-none relative">
                                    <div className="relative">
                                        <img
                                            src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name + "&background=e2e8f0&color=0f172a"}
                                            alt="User"
                                            className="w-9 h-9 rounded-full border-2 border-slate-200 group-hover:border-transparent group-hover:ring-2 group-hover:ring-cyan-500 group-hover:ring-offset-2 shadow-sm transition-all duration-300"
                                        />
                                        {/* Online indicator */}
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                                    </div>
                                </button>

                                {/* Dropdown */}
                                <div className="absolute right-0 mt-3 w-56 glass-premium p-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                                    <div className="px-3 py-2 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 uppercase tracking-wider border-b border-slate-200/50 mb-2">My Account</div>
                                    <Link to={`/users/${user._id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 hover:text-slate-900 rounded-xl transition-all group/item">
                                        <svg className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Profile
                                    </Link>
                                    <Link to="/settings/profile" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 hover:text-slate-900 rounded-xl transition-all group/item">
                                        <svg className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Settings
                                    </Link>
                                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 hover:text-slate-900 rounded-xl transition-all group/item">
                                        <svg className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                        Dashboard
                                    </Link>
                                    <Link to="/collections" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 hover:text-slate-900 rounded-xl transition-all group/item">
                                        <svg className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        Collections
                                    </Link>
                                    {isModerator && (
                                        <Link to="/moderation" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 hover:text-slate-900 rounded-xl transition-all group/item">
                                            <svg className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            Moderation
                                        </Link>
                                    )}
                                    <div className="my-2 border-t border-slate-200/50"></div>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all group/item">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Log in</Link>
                            <Link to="/signup" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden group">
                                <span className="relative z-10">Get Started</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-2">
                            <Link to="/learning-paths" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Learning Paths</Link>
                            <Link to="/projects" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Project Gallery</Link>
                            <Link to="/events" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Events</Link>
                            <Link to="/community" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Community</Link>
                            {isModerator && (
                                <Link to="/moderation" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Moderation</Link>
                            )}
                            {user ? (
                                <>
                                    <div className="border-t border-slate-200 my-2"></div>
                                    <Link to="/dashboard" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Dashboard</Link>
                                    <Link to="/collections" className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-cyan-600 rounded-lg transition-colors">Collections</Link>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-500/10 rounded-lg transition-colors">Logout</button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                                    <Link to="/login" className="flex justify-center px-4 py-3 text-base font-bold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors">Log in</Link>
                                    <Link to="/signup" className="flex justify-center px-4 py-3 text-base font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">Sign up</Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
