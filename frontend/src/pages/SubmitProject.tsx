import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// import { AuthContext } from '../context/AuthContext';

const SubmitProject = () => {
    // const auth = useContext(AuthContext);
    // const user = auth?.user; 
    // Not strictly needed if we just use token from localstorage, but good for UI. 
    // Removing unused import for now to clear lint.
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [repoLink, setRepoLink] = useState('');
    const [demoLink, setDemoLink] = useState('');
    const [tags, setTags] = useState('');

    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setCoverImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {

            let coverImageUrl = '';

            // 1. Upload Image if exists
            if (coverImage) {
                const formData = new FormData();
                formData.append('file', coverImage);
                formData.append('type', 'image'); // Hint for backend

                const uploadRes = await api.post('/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                coverImageUrl = uploadRes.data.url;
            }

            // 2. Create Project
            await api.post('/projects', {
                title,
                description,
                repoLink,
                demoLink,
                coverImage: coverImageUrl,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean)
            });

            // 3. Redirect
            navigate('/projects');
        } catch (err) {
            console.error('Error creating project:', err);
            alert('Failed to submit project');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit Your Project</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. AI Habit Tracker"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Markdown supported)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Tell us about your project..."
                    />
                </div>

                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                {coverImage ? coverImage.name : 'PNG, JPG, GIF up to 10MB'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
                        <input
                            type="url"
                            value={repoLink}
                            onChange={(e) => setRepoLink(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://github.com/..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Live Demo URL</label>
                        <input
                            type="url"
                            value={demoLink}
                            onChange={(e) => setDemoLink(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="React, Node.js, AI"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {uploading ? 'Submitting...' : 'Submit Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmitProject;
