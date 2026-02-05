import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/AppNavbar';

const EditProfile = () => {
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        jobTitle: '',
        company: '',
        bio: '',
        location: '',
        website: '',
        skills: '',
        github: '',
        linkedin: '',
        leetcode: '',
        stackoverflow: '',
        medium: '',
        twitter: ''
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                jobTitle: user.jobTitle || user.title || '', // Fallback for legacy
                company: user.company || '',
                bio: user.bio || '',
                location: user.location || '',
                website: user.website || '',
                skills: user.skills ? user.skills.join(', ') : '',
                github: user.socials?.github || '',
                linkedin: user.socials?.linkedin || '',
                leetcode: user.socials?.leetcode || '',
                stackoverflow: user.socials?.stackoverflow || '',
                medium: user.socials?.medium || '',
                twitter: user.socials?.twitter || ''
            });
            setPreviewAvatar(user.avatar || null);
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewAvatar(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload Avatar if changed
            let avatarUrl = user?.avatar;
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                const res = await api.post('/users/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                avatarUrl = res.data.avatarUrl;
            }

            // 2. Update Profile Data
            const updates = {
                ...formData,
                avatar: avatarUrl,
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                socials: {
                    github: formData.github,
                    linkedin: formData.linkedin,
                    leetcode: formData.leetcode,
                    stackoverflow: formData.stackoverflow,
                    medium: formData.medium,
                    twitter: formData.twitter
                }
            };

            // Clean up empty strings
            if (!updates.website) delete (updates as any).website;
            if (!updates.company) delete (updates as any).company;

            const { data } = await api.put('/users/profile', updates);

            // Update local context
            if (auth?.login) {
                const token = localStorage.getItem('token');
                if (token && data.user) {
                    auth.login(token, data.user);
                }
                toast.success('Profile updated successfully!');
                navigate(`/users/${data.user._id}`);
            }
        } catch (err) {
            console.error('Failed to update profile', err);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Navbar />

            {/* Header Background */}
            <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-2xl font-display font-bold text-slate-900">Edit Profile</h1>
                        <p className="text-slate-500 text-sm mt-1">Update your personal details and public profile.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                            <div className="relative group">
                                <img
                                    src={previewAvatar || `https://ui-avatars.com/api/?name=${user?.name}&background=e2e8f0&color=0f172a`}
                                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="font-bold text-slate-900">Profile Photo</h3>
                                <p className="text-xs text-slate-500 mt-1 mb-3">Recommended: Square JPG, PNG. Max 1MB.</p>
                                <label className="btn-secondary px-4 py-2 cursor-pointer text-sm inline-block">
                                    Upload New Photo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Display Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Username</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">@</span>
                                    <input
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="username"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Job Title</label>
                                <input
                                    name="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={handleChange}
                                    placeholder="e.g. Senior Developer"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company</label>
                                <input
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                                    placeholder="Tell the community about yourself..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Skills</label>
                                <input
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="React, Node.js, UX Design (comma separated)"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-2">Separate skills with commas. These will appear as tags on your profile.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Location</label>
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. San Francisco"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Website</label>
                                <input
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://your-portfolio.com"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Social Profiles */}
                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4">Social Profiles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">GitHub URL</label>
                                    <input name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">LinkedIn URL</label>
                                    <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">LeetCode URL</label>
                                    <input name="leetcode" value={formData.leetcode} onChange={handleChange} placeholder="https://leetcode.com/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Stack Overflow URL</label>
                                    <input name="stackoverflow" value={formData.stackoverflow} onChange={handleChange} placeholder="https://stackoverflow.com/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Medium URL</label>
                                    <input name="medium" value={formData.medium} onChange={handleChange} placeholder="https://medium.com/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Twitter / X URL</label>
                                    <input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="https://x.com/..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-cyan-500/30 text-white font-bold"
                            >
                                {loading ? 'Saving Changes...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
