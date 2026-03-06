import { Request, Response } from 'express';
import { BookingModel } from '../models/Booking.js';
import { PropertyModel } from '../models/Property.js';
import { sendEmail } from '../services/emailService.js';
import Joi from 'joi';

const bookingSchema = Joi.object({
  property_id: Joi.string().required(),
  start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  total_amount: Joi.number().positive().required(),
  notes: Joi.string().optional().allow(''),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'cancelled', 'completed').required(),
  rejection_reason: Joi.string().when('status', {
    is: 'cancelled',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  })
});

export const getBookedDates = async (req: Request, res: Response) => {
  try {
    const { property_id } = req.params;
    
    const bookedDates = await BookingModel.getBookedDates(property_id);
    
    res.json({ 
      success: true, 
      data: bookedDates 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    // Validate end_date is after start_date
    if (new Date(value.end_date) <= new Date(value.start_date)) {
      return res.status(400).json({ 
        success: false, 
        error: 'End date must be after start date' 
      });
    }

    // Verify property exists and calculate correct price
    const property = await PropertyModel.findById(value.property_id);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        error: 'Property not found' 
      });
    }

    if (!property.is_active) {
      return res.status(400).json({ 
        success: false, 
        error: 'Property is not available for booking' 
      });
    }

    // Calculate and validate total amount
    const start = new Date(value.start_date);
    const end = new Date(value.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const months = Math.ceil(days / 30);
    const calculatedAmount = months * property.price_per_month;

    if (Math.abs(value.total_amount - calculatedAmount) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid total amount. Please refresh and try again.' 
      });
    }

    // Check for booking conflicts
    const hasConflict = await BookingModel.checkConflict(
      value.property_id,
      value.start_date,
      value.end_date
    );

    if (hasConflict) {
      return res.status(409).json({ 
        success: false, 
        error: 'Property is already booked for the selected dates' 
      });
    }

    const booking = await BookingModel.create({
      property_id: value.property_id,
      start_date: value.start_date,
      end_date: value.end_date,
      total_amount: calculatedAmount,
      farmer_id: (req as any).user.id,
      status: 'pending_payment',
      payment_status: 'pending',
    });

    // Send notification to owner
    await sendEmail({
      to: property.owner_email,
      subject: 'New Booking Request',
      template: 'new-booking',
      data: {
        propertyTitle: property.title,
        farmerName: (req as any).user.name,
        startDate: value.start_date,
        endDate: value.end_date,
        amount: calculatedAmount
      }
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await BookingModel.findByFarmer((req as any).user.id);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

export const getOwnerBookings = async (req: Request, res: Response) => {
  try {
    const { status, property_id } = req.query;
    const bookings = await BookingModel.findByOwner(
      (req as any).user.id,
      status as string,
      property_id as string
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await BookingModel.findByIdWithDetails(id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Check authorization
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    if (booking.farmer_id !== userId && booking.owner_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = statusUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const booking = await BookingModel.findByIdWithDetails(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Verify owner authorization
    if (booking.owner_id !== (req as any).user.id) {
      return res.status(403).json({ success: false, error: 'Only property owner can update booking status' });
    }

    // Validate status transitions
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot update status of completed or cancelled bookings' 
      });
    }

    if (value.status === 'confirmed' && booking.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot confirm booking until payment is completed' 
      });
    }

    await BookingModel.updateStatus(id, value.status, value.rejection_reason);

    // Send notification to farmer
    await sendEmail({
      to: booking.farmer_email,
      subject: `Booking ${value.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}`,
      template: 'booking-status-update',
      data: {
        propertyTitle: booking.property_title,
        status: value.status,
        rejectionReason: value.rejection_reason,
        startDate: booking.start_date,
        endDate: booking.end_date
      }
    });

    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking status' });
  }
};

export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const stats = await BookingModel.getOwnerStats((req as any).user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking statistics' });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await BookingModel.findByIdWithDetails(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const userId = (req as any).user.id;
    
    // Only farmer or owner can cancel
    if (booking.farmer_id !== userId && booking.owner_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel completed bookings' 
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking is already cancelled' 
      });
    }

    // Handle refunds for paid bookings
    if (booking.payment_status === 'paid') {
      // TODO: Implement refund logic with Paystack
      // For now, just log it for manual processing
      console.log(`⚠️ REFUND NEEDED: Booking ${id}, Amount: ${booking.total_amount}, Reference: ${booking.payment_reference}`);
    }

    await BookingModel.updateStatus(id, 'cancelled', reason);

    // Notify the other party
    const notifyEmail = booking.farmer_id === userId ? booking.owner_email : booking.farmer_email;
    const cancelledBy = booking.farmer_id === userId ? 'farmer' : 'owner';

    await sendEmail({
      to: notifyEmail,
      subject: 'Booking Cancelled',
      template: 'booking-cancelled',
      data: {
        propertyTitle: booking.property_title,
        cancelledBy,
        reason,
        startDate: booking.start_date,
        endDate: booking.end_date
      }
    });

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
};
