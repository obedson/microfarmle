import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Search, BarChart3, Calendar, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const ownerActions = [
    {
      title: 'Add New Property',
      description: 'List a new livestock farming space',
      icon: Plus,
      to: '/create-property',
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      title: 'View Properties',
      description: 'Manage your listed properties',
      icon: Eye,
      to: '/my-properties',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Bookings',
      description: 'View and manage bookings',
      icon: Calendar,
      to: '/my-bookings',
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  const farmerActions = [
    {
      title: 'Browse Properties',
      description: 'Find the perfect farming space',
      icon: Search,
      to: '/properties',
      color: 'bg-primary-600 hover:bg-primary-700'
    },
    {
      title: 'My Bookings',
      description: 'View your current bookings',
      icon: Calendar,
      to: '/my-bookings',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Nearby Properties',
      description: 'Discover spaces near you',
      icon: MapPin,
      to: '/properties?nearby=true',
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  const actions = user?.role === 'owner' ? ownerActions : farmerActions;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-primary-100 text-lg">
              {user?.role === 'owner' 
                ? 'Manage your properties and bookings' 
                : 'Find and book the perfect farming space'
              }
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 bg-primary-500 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
              {user?.role === 'owner' ? 'Property Owner' : 'Farmer'}
            </div>
          </div>
          <div className="hidden md:block">
            <BarChart3 size={64} className="text-primary-200" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <MapPin size={24} className="text-primary-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₦0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.to}>
                <Card className="p-6 group cursor-pointer">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white transition-colors ${action.color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Activity
        </h2>
        <Card className="p-6">
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recent activity
            </h3>
            <p className="text-gray-600 mb-6">
              {user?.role === 'owner' 
                ? 'Start by adding your first property to see activity here.'
                : 'Browse properties and make your first booking to see activity here.'
              }
            </p>
            <Link to={user?.role === 'owner' ? '/create-property' : '/properties'}>
              <Button>
                {user?.role === 'owner' ? 'Add Property' : 'Browse Properties'}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
