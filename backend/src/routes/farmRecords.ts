import { Router } from 'express';
import { 
  createRecord, 
  getMyRecords, 
  getAnalytics, 
  updateRecord, 
  deleteRecord,
  linkToBooking,
  getPropertyProductivity,
  getFarmerRecommendations
} from '../controllers/farmRecordController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getMyRecords);
router.post('/', authenticateToken, createRecord);
router.get('/my-records', authenticateToken, getMyRecords);
router.get('/analytics', authenticateToken, getAnalytics);
router.get('/recommendations', authenticateToken, getFarmerRecommendations);
router.put('/:id', authenticateToken, updateRecord);
router.delete('/:id', authenticateToken, deleteRecord);
router.patch('/:id/link-booking', authenticateToken, linkToBooking);
router.get('/property/:propertyId/productivity', authenticateToken, getPropertyProductivity);

export default router;
