import React from 'react';
import { Calendar, MapPin, User, DollarSign, Clock } from 'lucide-react';

interface BookingCardProps {
  booking: any;
  type: 'farmer' | 'owner';
  onCancel?: (booking: any) => void;
  onApprove?: (booking: any) => void;
  onReject?: (booking: any) => void;
  onContact?: (booking: any) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  type,
  onCancel,
  onApprove,
  onReject,
  onContact
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment_status: string) => {
    switch (payment_status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {booking.properties?.title || 'Property'}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status?.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(booking.payment_status)}`}>
              {booking.payment_status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">
            ₦{booking.total_amount?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin size={18} className="text-gray-400 mt-1" />
          <div>
            <p className="text-xs text-gray-500">Location</p>
            <p className="text-sm font-medium text-gray-900">
              {booking.properties?.city}, {booking.properties?.lga}
            </p>
          </div>
        </div>

        {/* Contact Person */}
        <div className="flex items-start gap-2">
          <User size={18} className="text-gray-400 mt-1" />
          <div>
            <p className="text-xs text-gray-500">
              {type === 'farmer' ? 'Property Owner' : 'Farmer'}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {type === 'farmer' 
                ? booking.properties?.users?.name 
                : booking.users?.name}
            </p>
            {booking.status === 'confirmed' && (
              <p className="text-xs text-gray-600">
                {type === 'farmer'
                  ? booking.properties?.users?.phone
                  : booking.users?.phone}
              </p>
            )}
          </div>
        </div>

        {/* Check-in */}
        <div className="flex items-start gap-2">
          <Calendar size={18} className="text-gray-400 mt-1" />
          <div>
            <p className="text-xs text-gray-500">Check-in</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(booking.start_date)}
            </p>
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-start gap-2">
          <Calendar size={18} className="text-gray-400 mt-1" />
          <div>
            <p className="text-xs text-gray-500">Check-out</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(booking.end_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Notes</p>
          <p className="text-sm text-blue-900">{booking.notes}</p>
        </div>
      )}

      {/* Rejection Reason */}
      {booking.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
          <p className="text-sm text-red-900">{booking.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-4 border-t">
        {/* Farmer Actions */}
        {type === 'farmer' && (
          <>
            {booking.status === 'pending_payment' && (
              <button
                onClick={() => window.location.href = `/payment/${booking.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Complete Payment
              </button>
            )}
            {(booking.status === 'pending' || booking.status === 'confirmed') && onCancel && (
              <button
                onClick={() => onCancel(booking)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Cancel Booking
              </button>
            )}
            {booking.status === 'confirmed' && onContact && (
              <button
                onClick={() => onContact(booking)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Contact Owner
              </button>
            )}
          </>
        )}

        {/* Owner Actions */}
        {type === 'owner' && (
          <>
            {booking.status === 'pending' && booking.payment_status === 'paid' && (
              <>
                {onApprove && (
                  <button
                    onClick={() => onApprove(booking)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Approve
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(booking)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    Reject
                  </button>
                )}
              </>
            )}
            {onContact && (
              <button
                onClick={() => onContact(booking)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Contact Farmer
              </button>
            )}
          </>
        )}
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>Created: {formatDate(booking.created_at)}</span>
        </div>
        {booking.cancelled_at && (
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>Cancelled: {formatDate(booking.cancelled_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
