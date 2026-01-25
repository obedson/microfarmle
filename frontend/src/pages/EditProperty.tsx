import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propertyAPI } from '../api/client';

const EditProperty: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    livestock_type: '',
    space_type: '',
    size: 0,
    size_unit: 'm2',
    city: '',
    lga: '',
    price_per_month: 0,
    available_from: '',
    available_to: '',
    amenities: [] as string[]
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await propertyAPI.getById(id!);
        const property = response.data.data;
        setFormData({
          title: property.title,
          description: property.description,
          livestock_type: property.livestock_type,
          space_type: property.space_type,
          size: property.size,
          size_unit: property.size_unit,
          city: property.city,
          lga: property.lga,
          price_per_month: property.price_per_month,
          available_from: property.available_from,
          available_to: property.available_to,
          amenities: property.amenities || []
        });
      } catch (error) {
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (images.length > 0) {
        // If images are selected, use FormData
        const updateData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            updateData.append(key, JSON.stringify(value));
          } else {
            updateData.append(key, value.toString());
          }
        });
        
        images.forEach((image) => {
          updateData.append('images', image);
        });
        
        await propertyAPI.update(id!, updateData);
      } else {
        // No images, use regular JSON
        await propertyAPI.update(id!, formData);
      }
      
      navigate(`/properties/${id}`);
    } catch (error: any) {
      setError('Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Edit Property</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            required
            rows={4}
            className="w-full p-3 border rounded-lg"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Livestock Type</label>
            <select
              required
              className="w-full p-3 border rounded-lg"
              value={formData.livestock_type}
              onChange={(e) => setFormData({...formData, livestock_type: e.target.value})}
            >
              <option value="">Select type</option>
              <option value="poultry">Poultry</option>
              <option value="pig">Pig</option>
              <option value="cattle">Cattle</option>
              <option value="fishery">Fishery</option>
              <option value="goat">Goat</option>
              <option value="rabbit">Rabbit</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Space Type</label>
            <select
              required
              className="w-full p-3 border rounded-lg"
              value={formData.space_type}
              onChange={(e) => setFormData({...formData, space_type: e.target.value})}
            >
              <option value="">Select type</option>
              <option value="empty_land">Empty Land</option>
              <option value="equipped_house">Equipped House</option>
              <option value="empty_house">Empty House</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-3 border rounded-lg"
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: parseFloat(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Size Unit</label>
            <select
              className="w-full p-3 border rounded-lg"
              value={formData.size_unit}
              onChange={(e) => setFormData({...formData, size_unit: e.target.value})}
            >
              <option value="m2">Square Meters (m²)</option>
              <option value="units">Units</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LGA</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg"
              value={formData.lga}
              onChange={(e) => setFormData({...formData, lga: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Price per Month (₦)</label>
          <input
            type="number"
            required
            min="1"
            className="w-full p-3 border rounded-lg"
            value={formData.price_per_month}
            onChange={(e) => setFormData({...formData, price_per_month: parseFloat(e.target.value)})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Available From</label>
            <input
              type="date"
              required
              className="w-full p-3 border rounded-lg"
              value={formData.available_from}
              onChange={(e) => setFormData({...formData, available_from: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Available To</label>
            <input
              type="date"
              required
              className="w-full p-3 border rounded-lg"
              value={formData.available_to}
              onChange={(e) => setFormData({...formData, available_to: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full p-3 border rounded-lg"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
          <p className="text-sm text-gray-500 mt-1">Upload new images (will be added to existing ones)</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Property'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/properties/${id}`)}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProperty;
