import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus } from 'lucide-react';
import { propertyAPI } from '../api/client';
import Button from '../components/ui/Button';

interface PropertyForm {
  title: string;
  description: string;
  livestock_type: string;
  space_type: string;
  size: number;
  size_unit: string;
  city: string;
  lga: string;
  price_per_month: number;
  available_from: string;
  available_to: string;
  amenities: string;
}

const CreateProperty: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<PropertyForm>();
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: (data: any) => propertyAPI.create(data),
    onSuccess: () => {
      navigate('/dashboard');
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PropertyForm) => {
    const propertyData = {
      ...data,
      amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
      images: images, // Will be handled by backend
    };
    createMutation.mutate(propertyData);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Property</h1>
        <p className="text-gray-600">List your livestock space for rent</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Modern Poultry House in Lagos"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your property, facilities, and any special features..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livestock Type *
              </label>
              <select
                {...register('livestock_type', { required: 'Livestock type is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Livestock Type</option>
                <option value="poultry">Poultry</option>
                <option value="pig">Pig</option>
                <option value="cattle">Cattle</option>
                <option value="fishery">Fishery</option>
                <option value="goat">Goat</option>
                <option value="rabbit">Rabbit</option>
                <option value="other">Other</option>
              </select>
              {errors.livestock_type && <p className="text-red-500 text-sm mt-1">{errors.livestock_type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Space Type *
              </label>
              <select
                {...register('space_type', { required: 'Space type is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Space Type</option>
                <option value="empty_land">Empty Land</option>
                <option value="equipped_house">Equipped House</option>
                <option value="empty_house">Empty House</option>
              </select>
              {errors.space_type && <p className="text-red-500 text-sm mt-1">{errors.space_type.message}</p>}
            </div>
          </div>
        </div>

        {/* Size & Location */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Size & Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Size *</label>
                <input
                  {...register('size', { required: 'Size is required', min: 1 })}
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <select
                  {...register('size_unit', { required: 'Unit is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="m2">m²</option>
                  <option value="units">Units</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Month (₦) *
              </label>
              <input
                {...register('price_per_month', { required: 'Price is required', min: 1 })}
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="50000"
              />
              {errors.price_per_month && <p className="text-red-500 text-sm mt-1">{errors.price_per_month.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                {...register('city', { required: 'City is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Lagos"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LGA *</label>
              <input
                {...register('lga', { required: 'LGA is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ikeja"
              />
              {errors.lga && <p className="text-red-500 text-sm mt-1">{errors.lga.message}</p>}
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available From *
              </label>
              <input
                {...register('available_from', { required: 'Start date is required' })}
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.available_from && <p className="text-red-500 text-sm mt-1">{errors.available_from.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available To *
              </label>
              <input
                {...register('available_to', { required: 'End date is required' })}
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.available_to && <p className="text-red-500 text-sm mt-1">{errors.available_to.message}</p>}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Images</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <Plus size={20} className="text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add Image</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-gray-500">Upload up to 5 images. First image will be the cover photo.</p>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Amenities</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities (Optional)
            </label>
            <input
              {...register('amenities')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Water supply, Electricity, Security, Parking (comma separated)"
            />
            <p className="text-sm text-gray-500 mt-1">Separate multiple amenities with commas</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1 md:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending}
            className="flex-1 md:flex-none"
          >
            Create Property
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProperty;
