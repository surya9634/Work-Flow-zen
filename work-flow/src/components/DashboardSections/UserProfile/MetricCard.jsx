import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)', // White to Light Blue (LightSkyBlue)
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
};

const MetricCard = ({ title, value, change, icon: Icon, color, onClick, isClickable = false }) => {
  // Determine if the change should be inverted (e.g., lower response time is good)
  const isGoodChange = change > 0;

  return (
    <div 
      className={`rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 ${
        isClickable ? 'cursor-pointer transform hover:scale-[1.02] hover:shadow-lg' : '' // Slightly reduced hover scale for a softer effect
      }`}
      onClick={onClick}
      style={BLUE_GRADIENT_STYLE} // Apply gradient background
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center space-x-1">
          {isGoodChange ? (
            <ArrowUp className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${isGoodChange ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === 'string' ? value : value.toLocaleString()}
        </h3>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
};

export default React.memo(MetricCard);