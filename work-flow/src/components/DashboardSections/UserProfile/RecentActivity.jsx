import React from 'react';
import { Clock } from 'lucide-react';
import ActivityItem from './ActivityItem';

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)', // White to Light Blue (LightSkyBlue)
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
};

const RecentActivity = ({ activities }) => {
  return (
    <div 
      className="rounded-xl p-6 shadow-sm border border-gray-100"
      style={BLUE_GRADIENT_STYLE} // Apply gradient background
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-1">
        {activities.map((activity) => (
          // Assuming ActivityItem doesn't need the gradient and should remain transparent/white
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(RecentActivity);