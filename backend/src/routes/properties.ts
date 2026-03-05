import { Router } from 'express';
import { createProperty, getProperties, getProperty, updateProperty, deleteProperty, uploadImages, deleteImage, updateImageOrder } from '../controllers/propertyController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', authenticateToken, createProperty);
router.post('/:id/images', authenticateToken, upload.array('images', 5), uploadImages);
router.put('/:id', authenticateToken, upload.array('images', 5), updateProperty);
router.delete('/:id', authenticateToken, deleteProperty);
router.delete('/:id/images', authenticateToken, deleteImage);
router.put('/:id/images/reorder', authenticateToken, updateImageOrder);

export default router;
