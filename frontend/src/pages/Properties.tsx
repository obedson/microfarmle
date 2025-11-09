import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { propertyAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import PropertyCard from '../components/PropertyCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Properties: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuthStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyAPI.getAll()
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid-responsive">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 space-y-4">
              <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const properties = data?.data?.data || [];
  
  // Transform backend data to match PropertyCard interface
  const transformedProperties = properties.map((property: any) => ({
    id: property.id,
    title: property.title,
    description: property.description,
    location: property.city,
    price: property.price_per_month,
    type: property.livestock_type,
    capacity: property.capacity || 0,
    images: property.images || [],
    owner: property.owner
  }));

  // Filter properties based on search and filters
  const filteredProperties = transformedProperties.filter((property: any) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || property.type === selectedType;
    return matchesSearch && matchesType;
  });

  const propertyTypes = [...new Set(transformedProperties.map((p: any) => p.type))] as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Available Properties
          </h1>
          <p className="text-gray-600">
            Discover the perfect livestock farming space for your needs
          </p>
        </div>
        {isAuthenticated && (
          <Link 
            to="/create-property"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Property
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle (Mobile) */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter size={20} />
            Filters
          </Button>

          {/* Type Filter (Desktop) */}
          <div className="hidden md:block">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 md:hidden">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
        </p>
        {(searchTerm || selectedType) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedType('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No properties found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or browse all available properties.
          </p>
          <Button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('');
            }}
          >
            View All Properties
          </Button>
        </div>
      ) : (
        <div className="grid-responsive">
          {filteredProperties.map((property: any) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;
