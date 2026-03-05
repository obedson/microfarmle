import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/Loading';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data);
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} color="blue" />
        <StatCard title="Properties" value={stats.totalProperties} color="green" />
        <StatCard title="Bookings" value={stats.totalBookings} color="purple" />
        <StatCard title="Revenue" value={`₦${stats.totalRevenue?.toLocaleString()}`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickAction title="Manage Users" onClick={() => navigate('/admin/users')} />
        <QuickAction title="Manage Properties" onClick={() => navigate('/admin/properties')} />
        <QuickAction title="View Bookings" onClick={() => navigate('/admin/bookings')} />
        <QuickAction title="Audit Logs" onClick={() => navigate('/admin/audit-logs')} />
      </div>
    </div>
  );
}

const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-gray-600 text-sm mb-2">{title}</p>
    <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
  </div>
);

const QuickAction = ({ title, onClick }: { title: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition"
  >
    <p className="text-lg font-semibold">{title}</p>
  </button>
);
