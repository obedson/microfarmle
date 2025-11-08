import { Router } from 'express';
import { createProperty, getProperties, getProperty, updateProperty, deleteProperty, uploadImages } from '../controllers/propertyController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', authenticateToken, createProperty);
router.post('/:id/images', authenticateToken, upload.array('images', 5), uploadImages);
router.put('/:id', authenticateToken, updateProperty);
router.delete('/:id', authenticateToken, deleteProperty);

export default router;
