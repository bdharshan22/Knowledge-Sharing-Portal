
import express from 'express';
import { upload } from '../middleware/uploadMiddleware';
import { uploadFile } from '../utils/cloudinary';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'auto';
        const folder = req.file.mimetype === 'application/pdf' ? 'documents' : 'images';

        const result: any = await uploadFile(req.file.buffer, `knowledge-portal/${folder}`, resourceType);

        res.json({
            url: result.secure_url,
            name: req.file.originalname,
            type: resourceType === 'raw' ? 'pdf' : 'image',
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload failed' });
    }
});

export default router;
