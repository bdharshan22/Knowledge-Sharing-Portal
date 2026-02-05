import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string, category: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query, category);
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6 bg-white p-4 rounded shadow">
            <input
                type="text"
                placeholder="Search posts..."
                className="flex-1 p-2 border rounded"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <select
                className="p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Science">Science</option>
                <option value="Health">Health</option>
                <option value="General">General</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
        </form>
    );
};

export default SearchBar;
