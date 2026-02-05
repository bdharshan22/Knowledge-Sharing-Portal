import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
    minWordCount?: number;
}

const TableOfContents = ({ content, minWordCount = 1000 }: TableOfContentsProps) => {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Extract headings from markdown content
    useEffect(() => {
        const wordCount = content.split(/\s+/).length;
        if (wordCount < minWordCount) {
            setHeadings([]);
            return;
        }

        const headingRegex = /^(#{2,3})\s+(.+)$/gm;
        const extractedHeadings: Heading[] = [];
        let match;

        while ((match = headingRegex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

            extractedHeadings.push({ id, text, level });
        }

        setHeadings(extractedHeadings);
    }, [content, minWordCount]);

    // Set up intersection observer for active section tracking
    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-100px 0px -80% 0px',
                threshold: 0
            }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (headings.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
        >
            <div className="glass-card p-6 w-64">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600 text-sm uppercase tracking-wider">
                        Table of Contents
                    </h3>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="lg:hidden p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <svg
                            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.nav
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2"
                        >
                            {headings.map((heading, index) => (
                                <motion.button
                                    key={heading.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => scrollToHeading(heading.id)}
                                    className={`block w-full text-left text-sm transition-all ${heading.level === 3 ? 'pl-4' : ''
                                        } ${activeId === heading.id
                                            ? 'text-cyan-600 font-bold border-l-2 border-cyan-500 pl-3 bg-cyan-50/50'
                                            : 'text-slate-600 hover:text-slate-900 border-l-2 border-transparent pl-3 hover:border-slate-300'
                                        }`}
                                >
                                    {heading.text}
                                </motion.button>
                            ))}
                        </motion.nav>
                    )}
                </AnimatePresence>

                {/* Progress Indicator */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>Reading Progress</span>
                        <span>{Math.round((headings.findIndex(h => h.id === activeId) + 1) / headings.length * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${((headings.findIndex(h => h.id === activeId) + 1) / headings.length) * 100}%`
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TableOfContents;
