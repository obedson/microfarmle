import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authenticateToken, upload.array('images', 5), createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

export default router;
