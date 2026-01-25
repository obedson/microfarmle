import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Filter } from 'lucide-react';
import { marketplaceApi } from '../api/marketplace';
import { useAuthStore } from '../store/authStore';

const Marketplace: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      const data = await marketplaceApi.getProducts({ category });
      const productsArray = Array.isArray(data) ? data : [];
      setProducts(productsArray);
      
      // Extract unique categories from products
      const uniqueCategories = ['', ...new Set(productsArray.map((p: any) => p.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setCategories(['']);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading marketplace...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agricultural Marketplace</h1>
        <Link 
          to="/marketplace/add-product"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-600" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            {categories.slice(1).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(products) && products.map((product: any) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Product Image */}
            <div className="h-48 bg-gray-200">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="text-gray-400" width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 6h-2.18l-1.41-1.41A2 2 0 0 0 15 4H9a2 2 0 0 0-1.41.59L6.18 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                        </svg>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="text-gray-400" size={48} />
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="text-green-600" size={24} />
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {product.category}
                </span>
              </div>
            
            <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Price:</span>
                <span className="font-semibold">₦{product.price}/{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Stock:</span>
                <span className="text-sm">{product.stock_quantity} {product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Min Order:</span>
                <span className="text-sm">{product.minimum_order} {product.unit}</span>
              </div>
            </div>
            
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{product.location}</span>
                <Link 
                  to={`/marketplace/products/${product.id}`}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Be the first to add a product to the marketplace!</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
