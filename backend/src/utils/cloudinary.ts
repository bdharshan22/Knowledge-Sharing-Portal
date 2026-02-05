import { v2 as cloudinary } from 'cloudinary';

export const uploadFile = async (buffer: Buffer, folder: string, resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto') => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                // Only apply transformations for images to avoid errors with PDFs/raw files
                transformation: resourceType === 'image' || resourceType === 'auto' ? [
                    { width: 800, crop: 'limit' } // Adjusted to be safer than face crop for generic documents
                ] : undefined
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(buffer);
    });
};