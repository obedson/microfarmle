import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function CreateGroup() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    state_id: '',
    lga_id: '',
    entry_fee: 1000,
    payment_reference: ''
  });

  const { data: eligibility, isLoading: checkingEligibility } = useQuery({
    queryKey: ['can-create-group'],
    queryFn: () => apiClient.get('/groups/can-create').then(r => r.data)
  });

  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: () => apiClient.get('/locations/states').then(r => r.data)
  });

  const { data: lgas } = useQuery({
    queryKey: ['lgas', formData.state_id],
    queryFn: () => apiClient.get(`/locations/lgas/${formData.state_id}`).then(r => r.data),
    enabled: !!formData.state_id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayment) {
      setShowPayment(true);
      return;
    }
    
    if (!formData.payment_reference) {
      alert('Please complete payment first');
      return;
    }

    try {
      await apiClient.post('/groups', formData);
      alert('Group created successfully! You are now a member.');
      navigate('/groups');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handlePaymentSuccess = (reference: string) => {
    setFormData({ ...formData, payment_reference: reference });
  };

  if (checkingEligibility) {
    return <div className="text-center py-12">Checking eligibility...</div>;
  }

  if (!eligibility?.canCreate) {
    const isAdmin = user?.role === 'admin';
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            {isAdmin ? 'Admin Access' : 'Cannot Create Group Yet'}
          </h2>
          {isAdmin ? (
            <p className="text-yellow-700 mb-4">
              As an admin, you have full access to create groups without restrictions.
            </p>
          ) : (
            <>
              <p className="text-yellow-700 mb-4">
                You need to invite <strong>10 paid members</strong> before you can create a group.
              </p>
              <div className="bg-white rounded p-4 mb-4">
                <p className="text-sm text-gray-600">Your Referral Code:</p>
                <p className="text-2xl font-bold text-green-600">{user?.referral_code || 'N/A'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Share this code with others during registration
                </p>
              </div>
            </>
          )}
          <button
            onClick={() => navigate('/groups')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Group</h1>

      {!showPayment ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Lagos Poultry Farmers Association"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Describe your group's purpose and activities..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select category</option>
            <option value="poultry">Poultry</option>
            <option value="cattle">Cattle</option>
            <option value="fishery">Fishery</option>
            <option value="goat">Goat</option>
            <option value="pig">Pig</option>
            <option value="general">General Farming</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <select
            required
            value={formData.state_id}
            onChange={(e) => setFormData({ ...formData, state_id: e.target.value, lga_id: '' })}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select state</option>
            {states?.map((state: any) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LGA *
          </label>
          <select
            required
            value={formData.lga_id}
            onChange={(e) => setFormData({ ...formData, lga_id: e.target.value })}
            disabled={!formData.state_id}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          >
            <option value="">Select LGA</option>
            {lgas?.map((lga: any) => (
              <option key={lga.id} value={lga.id}>
                {lga.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Fee (₦) *
          </label>
          <input
            type="number"
            required
            min="500"
            max="10000"
            step="100"
            value={formData.entry_fee}
            onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="1000"
          />
          <p className="text-xs text-gray-500 mt-1">
            Set between ₦500 - ₦10,000. Recommended: ₦1,000
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Proceed to Payment
          </button>
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Payment Required</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2">
              To create this group, you need to pay the entry fee of <strong>₦{formData.entry_fee.toLocaleString()}</strong>
            </p>
            <p className="text-xs text-blue-600">
              This payment makes you the first member of your group.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Reference *
            </label>
            <input
              type="text"
              required
              value={formData.payment_reference}
              onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter payment reference from Paystack"
            />
            <p className="text-xs text-gray-500 mt-1">
              Complete payment via Paystack and enter the reference here
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={!formData.payment_reference}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Create Group
            </button>
            <button
              onClick={() => setShowPayment(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
