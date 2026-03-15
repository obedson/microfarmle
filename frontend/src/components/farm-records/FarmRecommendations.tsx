import React, { useState, useEffect } from 'react';
import { farmRecordAPI, FarmRecommendation } from '../../services/farmRecordAPI';
import { Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const FarmRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<FarmRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await farmRecordAPI.getRecommendations();
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching farm recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <div className="animate-pulse h-32 bg-gray-50 rounded-xl"></div>;
  if (recommendations.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      case 'onboarding': return <CheckCircle className="text-primary-500" size={20} />;
      default: return <Lightbulb className="text-primary-500" size={20} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 border-amber-100';
      case 'onboarding': return 'bg-primary-50 border-primary-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
          <Info size={18} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Farm Insights</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className={`flex gap-4 p-4 rounded-xl border ${getBgColor(rec.type)}`}>
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(rec.type)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{rec.title}</h4>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmRecommendations;
