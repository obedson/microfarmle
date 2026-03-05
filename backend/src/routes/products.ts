import { Router, Response } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../utils/upload';
import { supabase } from '../utils/supabase';

const router = Router();

router.get('/', getProducts);
router.get('/my-products', authenticateToken, async (req: any, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('supplier_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/:id', getProduct);
router.post('/', authenticateToken, upload.array('images', 5), createProduct);
router.patch('/:id', authenticateToken, upload.array('images', 5), updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

export default router;
