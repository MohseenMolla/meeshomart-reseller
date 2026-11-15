import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { Product } from '../models';
import { detectImage } from '../utils/image';
import { uploadImage, deleteImage, cloudinaryConfigured } from '../services/cloudinary';

export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const FOLDER = 'reseller/products';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 8 },
  fileFilter: (_r, f, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG or WebP images are allowed'))
});

export const uploads = Router();
// Super Admin and Managers can upload images to Cloudinary
uploads.use(requireAuth, requireRole('super_admin', 'manager', 'staff'));

uploads.post('/product-images', upload.array('files', 8), async (req, res) => {
  if (!cloudinaryConfigured()) {
    return res.status(503).json({ success: false, error: 'Cloudinary image storage is not configured' });
  }
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) return res.status(400).json({ success: false, error: 'No files uploaded' });

  for (const f of files) {
    if (!detectImage(f.buffer)) {
      return res.status(400).json({ success: false, error: `${f.originalname} is not a valid JPG, PNG or WebP image` });
    }
  }

  const out = await Promise.all(files.map(f => uploadImage(f.buffer, FOLDER)));
  res.status(201).json({ success: true, data: out });
});

// Remove an uploaded-but-unsaved image
uploads.post('/product-images/delete', async (req, res) => {
  const { publicId } = z.object({ publicId: z.string().regex(/^reseller\/products\/[\w-]+$/) }).parse(req.body);
  if (await Product.exists({ 'images.publicId': publicId })) {
    return res.status(409).json({ success: false, error: 'Image is already in use by a product' });
  }
  await deleteImage(publicId);
  res.json({ success: true });
});
