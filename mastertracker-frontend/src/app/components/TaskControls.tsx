/*
Purpose: This component provides the control panel for task management, including search input, 
filter buttons, tag selection dropdown, and buttons for creating new tasks and tags.

Variables Summary:
- searchTerm: String for the current search query.
- onSearchChange: Function to update the search term.
- filter: Current filter type (all, active, completed, urgent).
- sortOrder: Object mapping filter types to sort direction (asc/desc).
- onFilterChange: Function to change the filter and toggle sort.
- selectedTags: Array of currently selected tags for filtering.
- onTagToggle: Function to toggle a tag's selection.
- showTagDropdown: Boolean for dropdown visibility.
- onTagDropdownToggle: Function to toggle dropdown.
- tags: Array of all available tags.
- onNewTaskClick, onCreateTagClick, onEditTagClick: Functions for button actions.

These variables are used to manage the UI state and handle user interactions for searching, filtering, and creating tasks/tags.
*/

import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { FilterType, Tag } from '@/app/types/task';

interface TaskControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filter: FilterType;
  sortOrder: Record<FilterType, 'asc' | 'desc'>;
  onFilterChange: (filter: FilterType) => void;
  selectedTags: Tag[];
  onTagToggle: (tag: Tag) => void;
  showTagDropdown: boolean;
  onTagDropdownToggle: () => void;
  tags: Tag[];
  onNewTaskClick: () => void;
  onCreateTagClick: () => void;
  onEditTagClick: () => void;
}

const TaskControls: React.FC<TaskControlsProps> = ({
  searchTerm,
  onSearchChange,
  filter,
  sortOrder,
  onFilterChange,
  selectedTags,
  onTagToggle,
  showTagDropdown,
  onTagDropdownToggle,
  tags,
  onNewTaskClick,
  onCreateTagClick,
  onEditTagClick
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-gray-800 w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex flex-col h-full gap-2">
          <button
            onClick={onNewTaskClick}
            className="flex-[3] px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 font-medium shadow-sm text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>

          <button
            type="button"
            onClick={onCreateTagClick}
            className="flex-[1] px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
            + Create Tag
          </button>
          <button
            type="button"
            onClick={onEditTagClick}
            className=" flex-row justify-center items-center px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
           ✏️ Edit Tag
          </button>          
        </div>
      </div>

      {/* Filters - Mobile Scrollable */}
      <div className="flex gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {(['all', 'active', 'completed', 'urgent'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => {
                if (filter === f) {
                  // Same filter clicked → toggle sort
                  onFilterChange(f); // This will trigger sort toggle in parent
                } else {
                  // New filter → set filter
                  onFilterChange(f);
                }
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
            >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="ml-1">
                    {sortOrder[f] === 'asc' ? '↑' : '↓'}
                  </span>
            </button>

          ))}
        </div>
        <div className="relative">
          <button
            onClick={onTagDropdownToggle}
            className="px-3 sm:px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Tags
            {selectedTags.length > 0 && (
              <span className="ml-1 text-xs bg-blue-600 text-white rounded-full px-2">
                {selectedTags.length}
              </span>
            )}
          </button>
          {showTagDropdown && (
            <div className="text-black absolute z-50 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                onMouseLeave={() => onTagDropdownToggle()}
            >
              {/* Clear all */}
              <button
                onClick={() => {
                  // Clear all selected tags
                  selectedTags.forEach(tag => onTagToggle(tag));
                  onTagDropdownToggle();
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Clear tags
              </button>

              <div className="max-h-60 overflow-y-auto">
                {tags.map(tag => {
                  const checked = selectedTags.some(t => t.id === tag.id);

                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onTagToggle(tag)}
                        className="accent-blue-600"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map(tag => (
                <span
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-medium"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button onClick={() => onTagToggle(tag)}>✕</button>
                </span>
              ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskControls;