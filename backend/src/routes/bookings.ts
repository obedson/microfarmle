import { Router } from 'express';
import { 
  createBooking, 
  getMyBookings, 
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  getBookingStats,
  cancelBooking
} from '../controllers/bookingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Farmer routes
router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);

// Owner routes
router.get('/owner/bookings', authenticateToken, getOwnerBookings);
router.get('/owner/stats', authenticateToken, getBookingStats);

// Shared routes
router.get('/:id', authenticateToken, getBookingById);
router.put('/:id/status', authenticateToken, updateBookingStatus);
router.put('/:id/cancel', authenticateToken, cancelBooking);

export default router;
