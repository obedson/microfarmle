import React, { useState } from 'react';
import { useFarmAnalytics } from '../hooks/useFarmRecords';
import { Download } from 'lucide-react';

const FarmAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: analyticsData, isLoading } = useFarmAnalytics(
    dateRange.startDate, 
    dateRange.endDate
  );

  const exportToPDF = () => {
    const analytics = analyticsData?.analytics;
    
    const printContent = `
      <html>
        <head>
          <title>Farm Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #16a34a; }
            .metric { margin: 10px 0; padding: 10px; border-left: 3px solid #16a34a; }
          </style>
        </head>
        <body>
          <h1>Farm Analytics Report</h1>
          <p><strong>Period:</strong> ${dateRange.startDate} to ${dateRange.endDate}</p>
          ${analytics ? `
            <div class="metric"><strong>Total Livestock:</strong> ${analytics.totalLivestock}</div>
            <div class="metric"><strong>Feed Consumption:</strong> ${analytics.totalFeedConsumption} kg</div>
            <div class="metric"><strong>Mortality Count:</strong> ${analytics.totalMortality}</div>
            <div class="metric"><strong>Total Expenses:</strong> ₦${analytics.totalExpenses.toLocaleString()}</div>
            <div class="metric"><strong>Mortality Rate:</strong> ${analytics.mortalityRate.toFixed(2)}%</div>
            <div class="metric"><strong>Records Count:</strong> ${analytics.recordCount}</div>
          ` : '<p>No data available for the selected date range</p>'}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoading) return <div>Loading analytics...</div>;

  const analytics = analyticsData?.analytics;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Farm Analytics</h3>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800">Total Livestock</h4>
            <p className="text-2xl font-bold text-blue-600">{analytics.totalLivestock}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">Feed Consumption</h4>
            <p className="text-2xl font-bold text-green-600">{analytics.totalFeedConsumption} kg</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800">Mortality Count</h4>
            <p className="text-2xl font-bold text-red-600">{analytics.totalMortality}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800">Total Expenses</h4>
            <p className="text-2xl font-bold text-yellow-600">₦{analytics.totalExpenses.toLocaleString()}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800">Mortality Rate</h4>
            <p className="text-2xl font-bold text-purple-600">{analytics.mortalityRate.toFixed(2)}%</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800">Records Count</h4>
            <p className="text-2xl font-bold text-gray-600">{analytics.recordCount}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmAnalytics;
