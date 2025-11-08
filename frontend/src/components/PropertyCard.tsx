import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, Users } from 'lucide-react';
import Card from './ui/Card';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  type: string;
  capacity: number;
  images?: string[];
  owner?: {
    name: string;
  };
}

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const imageUrl = property.images?.[0] || '/api/placeholder/400/300';

  return (
    <Card className="group">
      <Link to={`/properties/${property.id}`} className="block">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {property.type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
            {property.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {property.description}
          </p>

          {/* Location */}
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin size={16} className="mr-1" />
            <span>{property.location}</span>
          </div>

          {/* Features */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <Users size={16} className="mr-1" />
              <span>{property.capacity} capacity</span>
            </div>
            {property.owner && (
              <span className="text-xs">by {property.owner.name}</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-primary-600 font-semibold">
              <DollarSign size={18} className="mr-1" />
              <span className="text-lg">{property.price.toLocaleString()}</span>
              <span className="text-sm text-gray-500 ml-1">/month</span>
            </div>
            <div className="flex items-center text-gray-400 text-xs">
              <Calendar size={14} className="mr-1" />
              <span>Available</span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default PropertyCard;
