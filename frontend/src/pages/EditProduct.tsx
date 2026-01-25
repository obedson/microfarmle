import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceApi } from '../api/marketplace';

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    unit: '',
    stock_quantity: '',
    minimum_order: '',
    location: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await marketplaceApi.getProduct(id!);
        setFormData({
          name: product.name,
          category: product.category,
          description: product.description,
          price: product.price.toString(),
          unit: product.unit,
          stock_quantity: product.stock_quantity.toString(),
          minimum_order: product.minimum_order.toString(),
          location: product.location
        });
      } catch (error) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      if (images.length > 0) {
        const updateData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          updateData.append(key, value);
        });
        
        images.forEach((image) => {
          updateData.append('images', image);
        });
        
        await marketplaceApi.updateProduct(id!, updateData);
      } else {
        await marketplaceApi.updateProduct(id!, formData);
      }
      
      navigate('/marketplace');
    } catch (error: any) {
      setError(error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await marketplaceApi.deleteProduct(id!);
        navigate('/marketplace');
      } catch (error: any) {
        setError(error.message || 'Failed to delete product');
      }
    }
  };

  if (loading) return <div className="p-8">Loading product...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      
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
              className="w-full p-3 border rounded-lg"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-lg"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
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
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Add New Images (Optional)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full p-3 border rounded-lg"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Delete Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
