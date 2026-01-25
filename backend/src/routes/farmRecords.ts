import { Router } from 'express';
import { 
  createRecord, 
  getMyRecords, 
  getAnalytics, 
  updateRecord, 
  deleteRecord 
} from '../controllers/farmRecordController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createRecord);
router.get('/my-records', authenticateToken, getMyRecords);
router.get('/analytics', authenticateToken, getAnalytics);
router.put('/:id', authenticateToken, updateRecord);
router.delete('/:id', authenticateToken, deleteRecord);

export default router;
