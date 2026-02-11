/*
Purpose: This component displays a statistics card showing the count of tasks and their associated tags for a given category (e.g., Total, Active).

MOBILE-FRIENDLY UPDATES:
- Responsive layout that stacks vertically on small screens
- Touch-friendly tag badges with proper spacing
- Better font scaling for readability
- Improved grid system that adapts to screen size
- Enhanced padding and margins for mobile devices
- Optimized tag overflow handling
- Better visual hierarchy on small screens

Variables Summary:
- title: String prop for the title of the stats card (e.g., "Total", "Active").
- stats: TaskStats object containing an array of tasks and an array of tags with counts.
- color: Optional string prop for the color used in the count display, defaults to blue.

These variables are used to render the card with the task count in the specified color and a grid of tags showing their names and counts.
*/

import React from 'react';
import { TaskStats } from '@/app/types/task';

interface StatsCardProps {
  title: string;
  stats: TaskStats;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stats, color = '#3B82F6' }) => {
  return (
    <div className="text-black bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
        
        {/* Count Section */}
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 min-w-fit">
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide">
            {title}
          </div>
          <p 
            className="text-3xl sm:text-2xl lg:text-3xl font-bold text-center sm:text-left flex-shrink-0"
            style={{ color }}
          >
            {stats.tasks.length}
          </p>
        </div>

        {/* Tags Section */}
        {stats.tags.length > 0 && (
          <div className="flex-1 w-full">
            {/* Mobile: Single column or wrap, Desktop: Grid */}
            <div className="flex flex-wrap sm:grid sm:grid-cols-2 lg:grid-rows-2 lg:grid-flow-col lg:auto-cols-fr gap-1.5 sm:gap-x-3 sm:gap-y-1.5 lg:gap-x-4 lg:gap-y-2">
              {stats.tags.map(tag => (
                <div
                  key={tag.name}
                  className="flex items-center justify-start"
                >
                  <span
                    style={{
                      backgroundColor: tag?.color || '#3B82F6',
                      color: 'white'
                    }}
                    className="inline-flex items-center px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-xs font-medium whitespace-nowrap shadow-sm hover:shadow transition-shadow"
                  >
                    {tag.name} ({tag.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State when no tags */}
        {stats.tags.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-2 sm:py-0">
            <p className="text-[10px] xs:text-xs text-gray-400 italic">No tags</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;