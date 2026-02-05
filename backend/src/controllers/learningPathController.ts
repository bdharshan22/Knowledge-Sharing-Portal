import { Request, Response } from 'express';
import { LearningPath } from '../models/LearningPath';
import { User } from '../models/User';

// Create a new learning path
export const createPath = async (req: Request, res: Response) => {
    try {
        const { title, description, coverImage, modules, difficulty, tags } = req.body;
        const author = (req as any).user.id;

        const path = await LearningPath.create({
            title,
            description,
            coverImage,
            author,
            modules,
            difficulty,
            tags,
            isPublished: true // Auto-publish for now
        });

        res.status(201).json(path);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all learning paths
export const getPaths = async (req: Request, res: Response) => {
    try {
        const paths = await LearningPath.find({ isPublished: true })
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 });
        res.json(paths);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single path details
export const getPathDetails = async (req: Request, res: Response) => {
    try {
        const path = await LearningPath.findById(req.params.id)
            .populate('author', 'name avatar')
            .populate('modules.steps.post'); // Populate post details for links

        if (!path) return res.status(404).json({ message: 'Path not found' });

        res.json(path);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Enroll user in path
export const enrollPath = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const pathId = req.params.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if already enrolled
        const isEnrolled = user.enrolledPaths.some(p => p.path?.toString() === pathId);
        if (isEnrolled) {
            return res.status(400).json({ message: 'Already enrolled' });
        }

        user.enrolledPaths.push({
            path: pathId as any,
            progress: 0,
            completedSteps: [],
            lastAccessed: new Date(),
            enrolledAt: new Date()
        });

        await user.save();

        // Increment enrolled count
        await LearningPath.findByIdAndUpdate(pathId, { $inc: { enrolledCount: 1 } });

        res.json(user.enrolledPaths);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update progress (mark step as complete)
export const updateProgress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const pathId = req.params.id;
        const { stepId } = req.body; // Post ID for the step

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const enrollment = user.enrolledPaths.find(p => p.path?.toString() === pathId);
        if (!enrollment) return res.status(404).json({ message: 'Not enrolled in this path' });

        // Add step to completed list if not already there
        if (!enrollment.completedSteps.includes(stepId)) {
            enrollment.completedSteps.push(stepId);
        }

        // Recalculate progress
        const path = await LearningPath.findById(pathId);
        if (path) {
            let totalSteps = 0;
            path.modules.forEach(m => totalSteps += m.steps.length);

            if (totalSteps > 0) {
                enrollment.progress = Math.round((enrollment.completedSteps.length / totalSteps) * 100);
            }
        }

        const milestones = [25, 50, 75, 100];
        enrollment.milestones = enrollment.milestones || [];
        milestones.forEach((milestone) => {
            if (enrollment.progress >= milestone && !enrollment.milestones.includes(milestone)) {
                enrollment.milestones.push(milestone);
            }
        });

        const now = new Date();
        const lastStudyDate = user.learningStreak?.lastStudyDate ? new Date(user.learningStreak.lastStudyDate) : null;
        const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (!user.learningStreak) {
            user.learningStreak = { current: 0, longest: 0, lastStudyDate: now } as any;
        }

        const streak = user.learningStreak!;

        if (!lastStudyDate) {
            streak.current = 1;
        } else {
            const diffMs = normalizeDate(now).getTime() - normalizeDate(lastStudyDate).getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // same day, keep streak
            } else if (diffDays === 1) {
                streak.current = (streak.current || 0) + 1;
            } else {
                streak.current = 1;
            }
        }

        streak.longest = Math.max(streak.longest || 0, streak.current || 0);
        streak.lastStudyDate = now;

        enrollment.lastCompletedAt = now;
        enrollment.lastAccessed = new Date();
        await user.save();

        res.json({
            progress: enrollment.progress,
            completedSteps: enrollment.completedSteps,
            milestones: enrollment.milestones,
            streak: user.learningStreak
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
