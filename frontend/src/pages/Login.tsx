import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Send action: 'login' to enforce strict check
                const { data } = await api.post('/auth/google', { token: tokenResponse.access_token, action: 'login' });
                auth?.login(data.token, { name: data.name, email: data.email, role: data.role, _id: data._id, points: data.points, badges: data.badges });
                navigate('/');
            } catch (error: any) {
                // Show specific error from backend (e.g., "User not found")
                setErrorMessage(error?.response?.data?.message || 'Google login failed');
            }
        },
        onError: () => setErrorMessage('Google login failed'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setErrorMessage(null);
            const { data } = await api.post('/auth/login', { email, password });
            auth?.login(data.token, { name: data.name, email: data.email, role: data.role, _id: data._id, points: data.points, badges: data.badges });
            navigate('/');
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Login failed';
            setErrorMessage(message);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Gradient Mesh Background */}
            <div className="absolute inset-0 gradient-mesh-subtle" />

            {/* Floating Orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-[120px] animate-float" />
                <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl glass-premium overflow-hidden shadow-2xl shadow-slate-400/20 animate-fade-in-scale">
                    <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 relative overflow-hidden">
                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />

                        <div className="relative z-10">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-900 font-bold group">
                                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-cyan-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 group-hover:scale-110 transition-all duration-300">K</span>
                                <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all duration-300">Knowledge Portal</span>
                            </Link>
                            <h2 className="mt-8 text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">Welcome back</h2>
                            <p className="mt-3 text-slate-600 leading-relaxed">
                                Pick up exactly where you left off. Your learning path, saved posts, and community rooms are waiting.
                            </p>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {[
                                { title: 'Track your progress', body: 'Keep momentum with clear milestones and next steps.', icon: '📊' },
                                { title: 'Save the best ideas', body: 'Bookmark posts and revisit them any time.', icon: '💡' },
                                { title: 'Learn with peers', body: 'Get answers faster inside active rooms.', icon: '🤝' },
                            ].map((item, i) => (
                                <div key={item.title} className="rounded-2xl glass-card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div className="text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">{item.title}</div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 md:p-10 bg-white/95 backdrop-blur-sm">
                        <div className="lg:hidden mb-8">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-900 font-bold group">
                                <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-base font-bold text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">K</span>
                                <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-purple-600 transition-all duration-300">Knowledge Portal</span>
                            </Link>
                        </div>

                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">Sign in</h1>
                            <p className="mt-2 text-slate-600">Access your personalized feed and saved work.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errorMessage && (
                                <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-sm text-red-700 animate-slide-up">
                                    {errorMessage}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-500 mb-2">Email Address</label>
                                <div className="rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-transparent focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:bg-white transition-all duration-300 group">
                                    <input
                                        className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-500 mb-2">Password</label>
                                <div className="rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 focus-within:border-transparent focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:bg-white transition-all duration-300">
                                    <input
                                        className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button className="w-full btn-primary py-3.5 text-base shadow-2xl shadow-cyan-300/40 hover:shadow-cyan-400/50 relative overflow-hidden group">
                                <span className="relative z-10">Sign In</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white/90 px-2 text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => googleLogin()}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors group"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Sign in with Google</span>
                            </button>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Demo credentials</div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                                        onClick={() => {
                                            setEmail('admin@example.com');
                                            setPassword('password123');
                                        }}
                                    >
                                        Admin: admin@example.com / password123
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                                        onClick={() => {
                                            setEmail('jane@example.com');
                                            setPassword('password123');
                                        }}
                                    >
                                        User: jane@example.com / password123
                                    </button>
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-600">
                                No account?{' '}
                                <Link to="/signup" className="text-cyan-700 font-semibold hover:text-cyan-800">
                                    Create one
                                </Link>
                            </p>

                            <div className="text-center">
                                <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                                    Back to home
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
