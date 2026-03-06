import React from 'react';
import { Filter } from 'lucide-react';

interface BookingFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  propertyFilter?: string;
  onPropertyChange?: (propertyId: string) => void;
  properties?: Array<{ id: string; title: string }>;
  type: 'farmer' | 'owner';
}

const BookingFilters: React.FC<BookingFiltersProps> = ({
  statusFilter,
  onStatusChange,
  propertyFilter,
  onPropertyChange,
  properties,
  type
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'pending_payment', label: 'Pending Payment' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property Filter (Owner only) */}
        {type === 'owner' && properties && onPropertyChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property
            </label>
            <select
              value={propertyFilter || 'all'}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFilters;
