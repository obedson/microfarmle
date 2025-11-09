import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceApi } from '../api/marketplace';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    unit: '',
    stock_quantity: '',
    minimum_order: '1',
    location: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const suggestedCategories = [
    'Animal Feeds', 'Chicks', 'Fingerlings', 'Equipment', 'Seeds', 'Fertilizer',
    'Poultry Feed', 'Fish Feed', 'Cattle Feed', 'Day-old Chicks', 'Broiler Chicks',
    'Layer Chicks', 'Catfish Fingerlings', 'Tilapia Fingerlings', 'Farm Tools',
    'Irrigation Equipment', 'Incubators', 'Feeders', 'Drinkers', 'Vaccines',
    'Medications', 'Supplements', 'Organic Fertilizer', 'NPK Fertilizer'
  ];

  const suggestedUnits = [
    'kg', 'pieces', 'bags', 'liters', 'tons', 'cartons', 'boxes', 'bottles', 'sachets'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const productData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        productData.append(key, value.toString());
      });
      
      images.forEach((image, index) => {
        productData.append('images', image);
      });

      await marketplaceApi.createProduct(productData);
      navigate('/marketplace');
    } catch (error: any) {
      setError(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Product Name</label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input
              type="text"
              required
              list="categories"
              className="w-full p-3 border rounded-lg"
              placeholder="Type or select category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
            <datalist id="categories">
              {suggestedCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            <input
              type="text"
              required
              list="units"
              className="w-full p-3 border rounded-lg"
              placeholder="Type or select unit"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
            <datalist id="units">
              {suggestedUnits.map(unit => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
          </div>
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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price per Unit (₦)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              className="w-full p-3 border rounded-lg"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
            <input
              type="number"
              required
              min="0"
              className="w-full p-3 border rounded-lg"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Minimum Order</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-3 border rounded-lg"
              value={formData.minimum_order}
              onChange={(e) => setFormData({...formData, minimum_order: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg"
            placeholder="City, State"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Product Images (Optional)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full p-3 border rounded-lg"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
          <p className="text-sm text-gray-500 mt-1">Upload up to 5 images</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
