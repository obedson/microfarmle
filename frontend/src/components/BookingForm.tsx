import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Calendar, DollarSign, CreditCard } from 'lucide-react';
import { bookingAPI, paymentAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Button from './ui/Button';
import Card from './ui/Card';

interface BookingFormProps {
  property: any;
  onSuccess: () => void;
}

interface BookingForm {
  start_date: string;
  end_date: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ property, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BookingForm>();
  const { isAuthenticated } = useAuthStore();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const months = Math.ceil(days / 30);
    return months * property.price_per_month;
  };

  const bookingMutation = useMutation(
    (data: any) => bookingAPI.create(data),
    {
      onSuccess: (response) => {
        const booking = response.data.data;
        setBookingId(booking.id);
      },
    }
  );

  const paymentMutation = useMutation(
    (bookingId: string) => paymentAPI.initialize(bookingId),
    {
      onSuccess: (response) => {
        const { authorization_url } = response.data.data;
        window.location.href = authorization_url;
      },
    }
  );

  const onSubmit = (data: BookingForm) => {
    const bookingData = {
      property_id: property.id,
      start_date: data.start_date,
      end_date: data.end_date,
      total_amount: calculateTotal(),
    };
    bookingMutation.mutate(bookingData);
  };

  const handlePayment = () => {
    if (bookingId) {
      paymentMutation.mutate(bookingId);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ready to Book?
        </h3>
        <p className="text-gray-600 mb-6">
          Please login to book this property.
        </p>
      </Card>
    );
  }

  if (bookingId) {
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Payment
          </h3>
          <p className="text-gray-600">
            Booking created successfully!
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-2xl font-bold text-primary-600">
              ₦{calculateTotal().toLocaleString()}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          loading={paymentMutation.isLoading}
          className="w-full"
          size="lg"
        >
          <CreditCard size={20} />
          {paymentMutation.isLoading ? 'Redirecting...' : 'Pay with Paystack'}
        </Button>
      </Card>
    );
  }

  const total = calculateTotal();

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Book This Property</h3>
        <div className="flex items-center text-primary-600">
          <DollarSign size={20} className="mr-1" />
          <span className="text-2xl font-bold">₦{property.price_per_month?.toLocaleString()}</span>
          <span className="text-gray-500 ml-1">/month</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('start_date', { required: 'Start date is required' })}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.start_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('end_date', { required: 'End date is required' })}
              type="date"
              min={startDate || new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.end_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>

        {total > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-primary-600">₦{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {bookingMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              {(bookingMutation.error as any)?.response?.data?.message || 'Booking failed. Please try again.'}
            </p>
          </div>
        )}

        <Button
          type="submit"
          loading={bookingMutation.isLoading}
          className="w-full"
          size="lg"
        >
          <CreditCard size={20} />
          {bookingMutation.isLoading ? 'Creating Booking...' : 'Book Now'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          You'll be redirected to secure payment after booking
        </p>
      </div>
    </Card>
  );
};

export default BookingForm;
