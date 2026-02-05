import { Request, Response } from 'express';
import { Project } from '../models/Project';

// Create a new project
export const createProject = async (req: Request, res: Response) => {
    try {
        const { title, description, coverImage, galleryImages, repoLink, demoLink, tags } = req.body;
        const author = (req as any).user.id;

        const project = await Project.create({
            title,
            description,
            coverImage,
            galleryImages,
            repoLink,
            demoLink,
            tags,
            author
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all projects with filtering
export const getProjects = async (req: Request, res: Response) => {
    try {
        const { tag, sort } = req.query;
        let query: any = {};

        if (tag) {
            query.tags = tag;
        }

        let sortOption: any = { createdAt: -1 };
        if (sort === 'popular') {
            sortOption = { views: -1 }; // Or likes length if aggregated
        } else if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        }

        const projects = await Project.find(query)
            .populate('author', 'name avatar')
            .sort(sortOption);

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get project details
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('author', 'name avatar')
            .populate('comments.user', 'name avatar');

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Increment views
        project.views += 1;
        await project.save();

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Like a project
export const likeProject = async (req: Request, res: Response) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const userId = (req as any).user.id;

        if (project.likes.includes(userId)) {
            project.likes = project.likes.filter(id => id.toString() !== userId);
        } else {
            project.likes.push(userId);
        }

        await project.save();
        res.json(project.likes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Comment on a project
export const addComment = async (req: Request, res: Response) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const { text } = req.body;
        project.comments.push({
            user: (req as any).user.id,
            text
        });

        await project.save();

        const updatedProject = await Project.findById(req.params.id).populate('comments.user', 'name avatar');
        res.json(updatedProject?.comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
