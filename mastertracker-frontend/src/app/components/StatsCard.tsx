/*
Purpose: This component displays a statistics card showing the count of tasks and their associated tags for a given category (e.g., Total, Active).

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
    <div className="text-black bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
      <div className='flex gap-4'>
        <div className="text-2xl sm:text-3xl font-bold text-gray-900">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">{title}</div>
          <p className="text-center" style={{ color }}>{stats.tasks.length}</p>
        </div>
        <div className="place-items-center w-full grid grid-rows-2 grid-flow-col auto-cols-fr gap-x-4 gap-y-1">
          {stats.tags.map(tag => (
            <div
              key={tag.name}
              className="flex items-center justify-between text-xs text-gray-600"
            >
              <span
                style={{
                  backgroundColor: tag?.color || '#3B82F6',
                  color: 'white'
                }}
                className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium"
              >
                {tag.name} ({tag.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;