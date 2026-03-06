import { Router } from 'express';
import { 
  createBooking, 
  getMyBookings, 
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  getBookingStats,
  cancelBooking,
  getBookedDates
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/property/:property_id/booked-dates', getBookedDates);

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
