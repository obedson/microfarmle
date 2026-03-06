import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '../api/client';
import BookingList from '../components/bookings/BookingList';
import BookingFilters from '../components/bookings/BookingFilters';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const MyBookings: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingAPI.getMyBookings
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/bookings/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      toast.success('Booking cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    }
  });

  const bookings = data?.data?.data || [];
  
  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter((b: any) => b.status === statusFilter);

  const handleCancel = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleContact = (booking: any) => {
    const ownerEmail = booking.properties?.users?.email;
    const ownerPhone = booking.properties?.users?.phone;
    
    if (ownerEmail) {
      window.location.href = `mailto:${ownerEmail}?subject=Booking Inquiry - ${booking.properties?.title}`;
    } else if (ownerPhone) {
      window.location.href = `tel:${ownerPhone}`;
    }
  };

  const submitCancel = () => {
    if (selectedBooking && cancelReason.trim()) {
      cancelMutation.mutate({
        id: selectedBooking.id,
        reason: cancelReason
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your property bookings</p>
      </div>

      <BookingFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        type="farmer"
      />

      <BookingList
        bookings={filteredBookings}
        type="farmer"
        isLoading={isLoading}
        onCancel={handleCancel}
        onContact={handleContact}
      />

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this booking:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter cancellation reason..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={submitCancel}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
