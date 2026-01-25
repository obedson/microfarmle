import { Request, Response } from 'express';
import { BookingModel } from '../models/Booking';
import Joi from 'joi';

const bookingSchema = Joi.object({
  property_id: Joi.string().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().greater(Joi.ref('start_date')).required(),
  total_amount: Joi.number().positive().required(),
});

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const booking = await BookingModel.create({
      ...value,
      farmer_id: (req as any).user.id,
      status: 'pending',
      payment_status: 'pending',
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
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
