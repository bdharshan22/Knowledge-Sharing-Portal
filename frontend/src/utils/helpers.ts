export const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

export const timeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const getReputationRank = (reputation: number): string => {
    if (reputation < 100) return 'Newcomer';
    if (reputation < 500) return 'Contributor';
    if (reputation < 1000) return 'Regular';
    if (reputation < 2500) return 'Trusted';
    if (reputation < 5000) return 'Expert';
    if (reputation < 10000) return 'Master';
    return 'Legend';
};

export const getReputationColor = (reputation: number): string => {
    if (reputation < 100) return 'text-gray-600';
    if (reputation < 500) return 'text-green-600';
    if (reputation < 1000) return 'text-blue-600';
    if (reputation < 2500) return 'text-purple-600';
    if (reputation < 5000) return 'text-orange-600';
    if (reputation < 10000) return 'text-red-600';
    return 'text-yellow-600';
};

export const calculateLevel = (reputation: number): number => {
    if (reputation < 100) return 1;
    if (reputation < 500) return 2;
    if (reputation < 1000) return 3;
    if (reputation < 2500) return 4;
    if (reputation < 5000) return 5;
    return Math.floor(reputation / 1000) + 5;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};