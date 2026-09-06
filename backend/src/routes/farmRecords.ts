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
import { resolveTenant } from '../middleware/tenant.js';
import { requireFeature } from '../middleware/requireFeature.js';

const router = Router();

router.use(authenticateToken, resolveTenant);
router.get('/', getMyRecords);
router.post('/', requireFeature('farm_erp.operations'), createRecord);
router.get('/my-records', getMyRecords);
router.get('/analytics', getAnalytics);
router.get('/recommendations', requireFeature('intelligence.agronomic_recommendations'), getFarmerRecommendations);
router.put('/:id', requireFeature('farm_erp.operations'), updateRecord);
router.delete('/:id', requireFeature('farm_erp.operations'), deleteRecord);
router.patch('/:id/link-booking', requireFeature('farm_erp.operations'), linkToBooking);
router.get('/property/:propertyId/productivity', getPropertyProductivity);

export default router;
