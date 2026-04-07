'use client';

import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { FilterType, Tag } from '@/app/types/task';
import { useRouter } from 'next/navigation'; // Added for navigation

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
  searchPlaceholder?: string;
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
  onEditTagClick,
  searchPlaceholder = 'Search tasks…',
}) => {
  const router = useRouter(); // Initialize the router

  return (
    <div className="card p-4 sm:p-5 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-9 sm:pl-10"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col h-full gap-2">
          <button
            onClick={onNewTaskClick}
            className="btn btn-primary px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Task</span>
          </button>
          
          {/* View Notes Button - Now routes to /notes */}
          <button
            onClick={() => router.push('/notes')}
            className="btn btn-primary px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base"
          >
            <span>View Notes</span>
          </button>

          <button
            type="button"
            onClick={onCreateTagClick}
            className="btn btn-secondary py-1.5 text-sm"
          >
            + Create Tag
          </button>
          <button
            type="button"
            onClick={onEditTagClick}
            className="btn btn-secondary py-1.5 text-sm"
          >
            ✏️ Edit Tag
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {(['all', 'active', 'completed', 'urgent'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-sm flex-shrink-0 ${
                filter === f
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
              style={filter === f ? {
                backgroundColor: 'var(--tm-accent)',
                color: 'var(--tm-accent-text)',
              } : {}}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1 opacity-70">
                {sortOrder[f] === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          ))}
        </div>

        {/* Tag filter dropdown */}
        <div className="relative">
          <button
            onClick={onTagDropdownToggle}
            className="btn btn-secondary py-2 px-3 sm:px-4 text-sm flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Tags
            {selectedTags.length > 0 && (
              <span
                className="ml-1 text-xs rounded-full px-1.5 py-0.5 font-semibold"
                style={{ backgroundColor: 'var(--tm-accent)', color: 'var(--tm-accent-text)' }}
              >
                {selectedTags.length}
              </span>
            )}
          </button>

          {showTagDropdown && (
            <div
              className="absolute z-50 mt-2 w-56 rounded-xl shadow-[var(--tm-shadow-lg)] border border-border overflow-hidden animate-slide-up"
              style={{ backgroundColor: 'var(--tm-surface)' }}
              onMouseLeave={() => onTagDropdownToggle()}
            >
              <button
                onClick={() => {
                  selectedTags.forEach(tag => onTagToggle(tag));
                  onTagDropdownToggle();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-raised transition-colors"
              >
                Clear tags
              </button>
              <div className="max-h-60 overflow-y-auto">
                {tags.map(tag => {
                  const checked = selectedTags.some(t => t.id === tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-surface-raised transition-colors text-text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onTagToggle(tag)}
                        className="accent-accent rounded"
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
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

        {/* Active tag chips */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag.id}
                className="chip flex items-center gap-1.5 text-white text-xs font-medium px-2 py-1"
                style={{ backgroundColor: tag.color, borderRadius: '10px' }}
              >
                {tag.name}
                <button
                  onClick={() => onTagToggle(tag)}
                  className="hover:opacity-70 transition-opacity leading-none"
                  aria-label={`Remove ${tag.name} filter`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskControls;