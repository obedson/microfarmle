import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, DollarSign, Users, Calendar, ArrowLeft, Heart, Share2 } from 'lucide-react';
import { propertyAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import BookingForm from '../components/BookingForm';

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyAPI.getById(id!)
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const property = data?.data?.data;
  if (!property) return <div>Property not found</div>;

  const handleBookingSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/properties" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors">
        <ArrowLeft size={20} className="mr-2" />
        Back to Properties
      </Link>

      {/* Image Gallery */}
      <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
        <img
          src={property.images?.[0] || '/api/placeholder/800/400'}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {property.livestock_type}
          </span>
        </div>
        <div className="absolute top-4 right-4 flex space-x-2">
          <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
            <Heart size={20} className="text-gray-600" />
          </button>
          <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
            <Share2 size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {property.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center">
                <MapPin size={18} className="mr-1" />
                <span>{property.city}, {property.lga}</span>
              </div>
              <div className="flex items-center">
                <Users size={18} className="mr-1" />
                <span>{property.size} {property.size_unit}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={18} className="mr-1" />
                <span>Available {property.available_from} - {property.available_to}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-primary-600">
                <DollarSign size={24} className="mr-2" />
                <span className="text-3xl font-bold">₦{property.price_per_month?.toLocaleString()}</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">
              {property.description}
            </p>
          </Card>

          {/* Property Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Livestock Type:</span>
                <p className="font-medium">{property.livestock_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Space Type:</span>
                <p className="font-medium">{property.space_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <p className="font-medium">{property.size} {property.size_unit}</p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">{property.city}, {property.lga}</p>
              </div>
            </div>
          </Card>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity: string, index: number) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Booking Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {isAuthenticated ? (
              <BookingForm property={property} onSuccess={handleBookingSuccess} />
            ) : (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ready to Book?
                </h3>
                <p className="text-gray-600 mb-6">
                  Sign in to book this property and connect with the owner.
                </p>
                <div className="space-y-3">
                  <Link to="/login" className="block">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/register" className="block">
                    <Button variant="outline" className="w-full">Create Account</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
