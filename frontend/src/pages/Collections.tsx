import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/AppNavbar';

interface Collection {
    _id: string;
    name: string;
    description?: string;
    posts?: any[];
    isPublic?: boolean;
    createdAt?: string;
}

const Collections = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(false);

    const fetchCollections = async () => {
        try {
            const res = await api.get('/users/collections');
            setCollections(res.data.collections || []);
        } catch (err) {
            console.error('Failed to load collections', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollectionDetail = async (collectionId: string) => {
        setDetailLoading(true);
        try {
            const res = await api.get(`/users/collections/${collectionId}`);
            const collection = res.data.collection;
            setSelected(collection);
            setEditName(collection.name || '');
            setEditDescription(collection.description || '');
            setEditIsPublic(!!collection.isPublic);
        } catch (err) {
            console.error('Failed to load collection', err);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        if (selectedId) {
            fetchCollectionDetail(selectedId);
        } else {
            setSelected(null);
        }
    }, [selectedId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const res = await api.post('/users/collections', { name: name.trim(), description, isPublic });
            setCollections(res.data.collections || []);
            setName('');
            setDescription('');
            setIsPublic(false);
        } catch (err) {
            console.error('Failed to create collection', err);
        }
    };

    const handleUpdate = async () => {
        if (!selectedId) return;
        try {
            const res = await api.put(`/users/collections/${selectedId}`, {
                name: editName,
                description: editDescription,
                isPublic: editIsPublic
            });
            const updated = res.data.collection;
            setSelected(prev => prev ? { ...prev, ...updated } : updated);
            setCollections(prev => prev.map(col => (col._id === updated._id ? { ...col, ...updated } : col)));
        } catch (err) {
            console.error('Failed to update collection', err);
        }
    };

    const handleDelete = async (collectionId: string) => {
        const confirmed = window.confirm('Delete this collection?');
        if (!confirmed) return;

        try {
            const res = await api.delete(`/users/collections/${collectionId}`);
            setCollections(res.data.collections || []);
            if (selectedId === collectionId) {
                setSelectedId(null);
                setSelected(null);
            }
        } catch (err) {
            console.error('Failed to delete collection', err);
        }
    };

    const handleRemovePost = async (postId: string) => {
        if (!selectedId) return;
        try {
            await api.delete(`/users/collections/${selectedId}/posts/${postId}`);
            await fetchCollectionDetail(selectedId);
        } catch (err) {
            console.error('Failed to remove post', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Collections</h1>
                        <p className="text-slate-600 mt-2">Create learning playlists and organize saved posts.</p>
                    </div>
                    <Link to="/dashboard" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                        Back to dashboard
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
                    <div className="space-y-6">
                        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Create a Collection</h2>
                            <div className="space-y-4">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Collection name"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Short description"
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                />
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                    />
                                    Make public
                                </label>
                                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">
                                    Create Collection
                                </button>
                            </div>
                        </form>

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Collections</h2>
                            {loading ? (
                                <div className="py-8 text-slate-500">Loading collections...</div>
                            ) : collections.length === 0 ? (
                                <div className="text-slate-500">No collections yet. Create your first playlist above.</div>
                            ) : (
                                <div className="space-y-3">
                                    {collections.map((collection) => (
                                        <button
                                            key={collection._id}
                                            onClick={() => setSelectedId(collection._id)}
                                            className={`w-full text-left p-4 border rounded-xl transition-colors ${selectedId === collection._id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 hover:border-cyan-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-slate-900">{collection.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">{collection.description || 'No description yet.'}</div>
                                                </div>
                                                <div className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-1">
                                                    {(collection.posts || []).length} posts
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Collection Details</h2>
                            {selected && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(selected._id)}
                                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            )}
                        </div>

                        {!selectedId && <div className="text-slate-500">Select a collection to view details.</div>}
                        {selectedId && detailLoading && <div className="text-slate-500">Loading details...</div>}

                        {selected && !detailLoading && (
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900"
                                    />
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={editIsPublic}
                                            onChange={(e) => setEditIsPublic(e.target.checked)}
                                        />
                                        Public
                                    </label>
                                    <button type="button" onClick={handleUpdate} className="btn-secondary px-4 py-2 text-sm">
                                        Save changes
                                    </button>
                                </div>

                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Posts</div>
                                    {selected.posts && selected.posts.length > 0 ? (
                                        <div className="space-y-3">
                                            {selected.posts.map((post: any) => (
                                                <div key={post._id} className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4">
                                                    <div>
                                                        <Link to={`/posts/${post._id}`} className="font-bold text-slate-900 hover:text-cyan-700">
                                                            {post.title}
                                                        </Link>
                                                        <div className="text-xs text-slate-500 mt-1">{post.type} - {new Date(post.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePost(post._id)}
                                                        className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">No posts in this collection yet.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Collections;
