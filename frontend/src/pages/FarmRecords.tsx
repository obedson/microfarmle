import React from 'react';
import FarmRecordForm from '../components/FarmRecordForm';
import FarmAnalytics from '../components/FarmAnalytics';
import { useFarmRecords } from '../hooks/useFarmRecords';

const FarmRecords: React.FC = () => {
  const { data: recordsData, isLoading } = useFarmRecords();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Farm Records & Analytics
        </h1>
        <p className="text-gray-600">
          Track your livestock, monitor feed consumption, and analyze farm performance
        </p>
      </header>
      
      {/* Mobile-first grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FarmRecordForm />
        <FarmAnalytics />
      </div>

      {/* Records table card */}
      <div className="card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Records</h2>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-900">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-900">Livestock</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-900">Count</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-900 hidden sm:table-cell">Feed (kg)</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-900 hidden md:table-cell">Mortality</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-900">Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recordsData?.data && Array.isArray(recordsData.data) ? (
                  recordsData.data.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(record.record_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{record.livestock_type}</td>
                      <td className="px-6 py-4 text-gray-900">{record.livestock_count}</td>
                      <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">
                        {record.feed_consumption}
                      </td>
                      <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                        {record.mortality_count}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ₦{record.expenses.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <p>No records found</p>
                        <p className="text-sm">Start by adding your first farm record above</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmRecords;
