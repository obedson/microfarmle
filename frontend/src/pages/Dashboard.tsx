import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/Loading';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    bookings: 0, 
    properties: 0, 
    propertyBookings: 0,
    orders: 0,
    products: 0,
    sales: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (user && token) {
      fetchStats();
    }
  }, [user, token]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      console.log('User role:', user?.role);
      console.log('Token exists:', !!token);
      
      // Fetch all stats in parallel
      const [myBookings, allProperties, bookingsOnMyProperties, myOrders, myProducts, mySales] = await Promise.all([
        axios.get(`${API_URL}/bookings/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/properties`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/bookings/owner/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/products/my-products`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/orders/my-sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      // Calculate counts
      const myBookingsCount = myBookings.data.data?.length || 0;
      const allPropertiesData = allProperties.data.data || [];
      const myPropertiesCount = allPropertiesData.filter((p: any) => p.owner_id === user?.id).length;
      const bookingsOnMyPropertiesCount = bookingsOnMyProperties.data.data?.length || 0;
      const myOrdersCount = myOrders.data.data?.length || 0;
      const myProductsCount = myProducts.data.data?.length || 0;
      const mySalesCount = mySales.data.data?.length || 0;
      
      setStats({ 
        bookings: myBookingsCount, 
        properties: myPropertiesCount,
        propertyBookings: bookingsOnMyPropertiesCount,
        orders: myOrdersCount,
        products: myProductsCount,
        sales: mySalesCount
      });
    } catch (error: any) {
      console.error('Dashboard error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Rental Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Property Rentals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">My Bookings</p>
            <p className="text-4xl font-bold text-green-600">{stats.bookings}</p>
            <p className="text-sm text-gray-500 mt-1">Bookings I made</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">My Properties</p>
            <p className="text-4xl font-bold text-blue-600">{stats.properties}</p>
            <p className="text-sm text-gray-500 mt-1">Properties I own</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Property Bookings</p>
            <p className="text-4xl font-bold text-purple-600">{stats.propertyBookings}</p>
            <p className="text-sm text-gray-500 mt-1">Bookings on my properties</p>
          </div>
        </div>

        {/* Property Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.properties > 0 && (
            <button
              onClick={() => navigate('/my-properties')}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
            >
              <p className="text-lg font-semibold">My Properties</p>
              <p className="text-sm text-gray-500 mt-1">View and manage my listings</p>
            </button>
          )}
          {stats.properties > 0 && (
            <button
              onClick={() => navigate('/owner/bookings')}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
            >
              <p className="text-lg font-semibold">Manage Bookings</p>
              <p className="text-sm text-gray-500 mt-1">Confirm or view property bookings</p>
            </button>
          )}
          <button
            onClick={() => navigate('/my-bookings')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
          >
            <p className="text-lg font-semibold">My Bookings</p>
            <p className="text-sm text-gray-500 mt-1">View bookings I made</p>
          </button>
          <button
            onClick={() => navigate('/properties')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
          >
            <p className="text-lg font-semibold">Browse Properties</p>
            <p className="text-sm text-gray-500 mt-1">Find properties to rent</p>
          </button>
          <button
            onClick={() => navigate('/create-property')}
            className="bg-green-600 text-white rounded-lg shadow p-6 text-left hover:shadow-lg transition hover:bg-green-700"
          >
            <p className="text-lg font-semibold">List a Property</p>
            <p className="text-sm text-green-100 mt-1">Add a new property</p>
          </button>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">My Orders</p>
            <p className="text-4xl font-bold text-orange-600">{stats.orders}</p>
            <p className="text-sm text-gray-500 mt-1">Products purchased</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">My Products</p>
            <p className="text-4xl font-bold text-indigo-600">{stats.products}</p>
            <p className="text-sm text-gray-500 mt-1">Products listed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">My Sales</p>
            <p className="text-4xl font-bold text-pink-600">{stats.sales}</p>
            <p className="text-sm text-gray-500 mt-1">Products sold</p>
          </div>
        </div>

        {/* Marketplace Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/my-orders')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
          >
            <p className="text-lg font-semibold">My Orders</p>
            <p className="text-sm text-gray-500 mt-1">Track my purchases</p>
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
          >
            <p className="text-lg font-semibold">Browse Marketplace</p>
            <p className="text-sm text-gray-500 mt-1">Shop for products</p>
          </button>
          {stats.products > 0 && (
            <>
              <button
                onClick={() => navigate('/my-sales')}
                className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
              >
                <p className="text-lg font-semibold">My Sales</p>
                <p className="text-sm text-gray-500 mt-1">Manage incoming orders</p>
              </button>
              <button
                onClick={() => navigate('/my-marketplace-products')}
                className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
              >
                <p className="text-lg font-semibold">My Products</p>
                <p className="text-sm text-gray-500 mt-1">Manage product listings</p>
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/marketplace/add-product')}
            className="bg-indigo-600 text-white rounded-lg shadow p-6 text-left hover:shadow-lg transition hover:bg-indigo-700"
          >
            <p className="text-lg font-semibold">Sell a Product</p>
            <p className="text-sm text-indigo-100 mt-1">List product for sale</p>
          </button>
        </div>
      </div>
    </div>
  );
}
