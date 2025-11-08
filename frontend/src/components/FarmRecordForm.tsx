import React, { useState } from 'react';
import { useCreateFarmRecord } from '../hooks/useFarmRecords';
import { useQuery } from '@tanstack/react-query';
import { propertyAPI } from '../api/client';

const FarmRecordForm: React.FC = () => {
  const [formData, setFormData] = useState({
    property_id: '',
    livestock_type: '',
    livestock_count: 0,
    feed_consumption: 0,
    mortality_count: 0,
    expenses: 0,
    expense_category: '',
    notes: '',
    record_date: new Date().toISOString().split('T')[0]
  });

  const createRecord = useCreateFarmRecord();
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyAPI.getAll()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecord.mutate(formData, {
      onSuccess: () => {
        setFormData({
          property_id: '',
          livestock_type: '',
          livestock_count: 0,
          feed_consumption: 0,
          mortality_count: 0,
          expenses: 0,
          expense_category: '',
          notes: '',
          record_date: new Date().toISOString().split('T')[0]
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Add Farm Record</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Property</label>
          <select
            value={formData.property_id}
            onChange={(e) => setFormData({...formData, property_id: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Property</option>
            {propertiesData?.data && Array.isArray(propertiesData.data) ? (
              propertiesData.data.map((property: any) => (
                <option key={property.id} value={property.id}>
                  {property.title} - {property.location}
                </option>
              ))
            ) : null}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Livestock Type</label>
          <select
            value={formData.livestock_type}
            onChange={(e) => setFormData({...formData, livestock_type: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select Type</option>
            <option value="Poultry">Poultry</option>
            <option value="Cattle">Cattle</option>
            <option value="Pig">Pig</option>
            <option value="Goat">Goat</option>
            <option value="Fish">Fish</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Record Date</label>
          <input
            type="date"
            value={formData.record_date}
            onChange={(e) => setFormData({...formData, record_date: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Livestock Count</label>
          <input
            type="number"
            value={formData.livestock_count}
            onChange={(e) => setFormData({...formData, livestock_count: Number(e.target.value)})}
            className="w-full border rounded px-3 py-2"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Feed Consumption (kg)</label>
          <input
            type="number"
            step="0.01"
            value={formData.feed_consumption}
            onChange={(e) => setFormData({...formData, feed_consumption: Number(e.target.value)})}
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mortality Count</label>
          <input
            type="number"
            value={formData.mortality_count}
            onChange={(e) => setFormData({...formData, mortality_count: Number(e.target.value)})}
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expenses (₦)</label>
          <input
            type="number"
            step="0.01"
            value={formData.expenses}
            onChange={(e) => setFormData({...formData, expenses: Number(e.target.value)})}
            className="w-full border rounded px-3 py-2"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Expense Category</label>
        <input
          type="text"
          value={formData.expense_category}
          onChange={(e) => setFormData({...formData, expense_category: e.target.value})}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Feed, Medicine, Equipment"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={createRecord.isPending}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {createRecord.isPending ? 'Adding...' : 'Add Record'}
      </button>
    </form>
  );
};

export default FarmRecordForm;
