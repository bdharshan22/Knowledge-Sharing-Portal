import { createContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    points: number;
    badges: string[];
    avatar?: string;
    title?: string;
    jobTitle?: string;
    company?: string;
    website?: string;
    username?: string;
    bio?: string;
    location?: string;
    socials?: {
        github?: string;
        linkedin?: string;
        leetcode?: string;
        stackoverflow?: string;
        medium?: string;
        twitter?: string;
    };
    skills?: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
