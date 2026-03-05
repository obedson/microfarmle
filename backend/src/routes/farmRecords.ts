import { Router } from 'express';
import { 
  createRecord, 
  getMyRecords, 
  getAnalytics, 
  updateRecord, 
  deleteRecord 
} from '../controllers/farmRecordController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getMyRecords);
router.post('/', authenticateToken, createRecord);
router.get('/my-records', authenticateToken, getMyRecords);
router.get('/analytics', authenticateToken, getAnalytics);
router.put('/:id', authenticateToken, updateRecord);
router.delete('/:id', authenticateToken, deleteRecord);

export default router;
