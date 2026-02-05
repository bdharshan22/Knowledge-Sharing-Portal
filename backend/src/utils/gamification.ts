import { User } from '../models/User';
import { Notification } from '../models/Notification';

export const awardPoints = async (userId: string, points: number) => {
    try {
        const user = await User.findById(userId);
        if (user) {
            user.points += points;
            await user.save();
        }
    } catch (error) {
        console.error('Error awarding points:', error);
    }
};

export const calculateReputation = async (userId: string, action: string, points: number) => {
    const user = await User.findById(userId);
    if (!user) return;

    (user as any).reputation = ((user as any).reputation || 0) + points;
    (user as any).level = (user as any).calculateLevel ? (user as any).calculateLevel() : 1;
    await user.save();

    // Check for reputation milestones
    const milestones = [100, 500, 1000, 2500, 5000, 10000];
    if (milestones.includes((user as any).reputation)) {
        await Notification.create({
            recipient: userId,
            type: 'reputation_milestone',
            title: 'Reputation Milestone!',
            message: `You've reached ${(user as any).reputation} reputation points!`,
            data: { reputationGained: points }
        });
    }
};

export const awardBadges = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) return;

    const badges: any[] = [];

    // First Post Badge
    if ((user as any).stats?.postsCount === 1 && !(user as any).badges.some((b: any) => b.name === 'First Post')) {
        badges.push({
            name: 'First Post',
            description: 'Created your first post',
            icon: '📝',
            earnedAt: new Date()
        });
    }

    // Prolific Writer Badge
    if ((user as any).stats?.postsCount >= 10 && !(user as any).badges.some((b: any) => b.name === 'Prolific Writer')) {
        badges.push({
            name: 'Prolific Writer',
            description: 'Created 10 posts',
            icon: '✍️',
            earnedAt: new Date()
        });
    }

    // Helpful Badge
    if ((user as any).stats?.answersCount >= 5 && !(user as any).badges.some((b: any) => b.name === 'Helpful')) {
        badges.push({
            name: 'Helpful',
            description: 'Provided 5 helpful answers',
            icon: '🤝',
            earnedAt: new Date()
        });
    }

    // Nice Post Badge
    if ((user as any).stats?.likesReceived >= 10 && !(user as any).badges.some((b: any) => b.name === 'Nice Post')) {
        badges.push({
            name: 'Nice Post',
            description: 'Received 10 likes on your posts',
            icon: '👍',
            earnedAt: new Date()
        });
    }

    // Popular Badge
    if ((user as any).stats?.likesReceived >= 50 && !(user as any).badges.some((b: any) => b.name === 'Popular')) {
        badges.push({
            name: 'Popular',
            description: 'Received 50 likes',
            icon: '⭐',
            earnedAt: new Date()
        });
    }

    // Teacher Badge
    // Assuming we track accepted answers somewhere or check stats (we need to be sure stats has acceptedAnswersCount if we use it, or we infer it)
    // For now, let's look at reputation for a proxy or just rely on the controller passing a flag?
    // Actually, User.stats has 'answersCount'. We might need 'acceptedAnswersCount'.
    // Let's stick to what we can track easily or add a generic check.
    // We can query the DB for this too but let's keep it simple for now and rely on stats we have or simple reputation milestones.

    // Reputable Badge
    if ((user as any).reputation >= 500 && !(user as any).badges.some((b: any) => b.name === 'Reputable')) {
        badges.push({
            name: 'Reputable',
            description: 'Earned 500 reputation',
            icon: '🛡️',
            earnedAt: new Date()
        });
    }

    if (badges.length > 0) {
        (user as any).badges.push(...badges);
        await user.save();

        // Create notifications for new badges
        for (const badge of badges) {
            await Notification.create({
                recipient: userId,
                type: 'badge_earned',
                title: 'New Badge Earned!',
                message: `You earned the "${badge.name}" badge`,
                data: { badgeName: badge.name }
            });
        }
    }
};
