'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Note } from '@/app/types/notes';

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: number) => void;
}

// Strip all HTML tags to produce a plain-text preview string.
const stripHtml = (html: string): string => html.replace(/<[^>]+>/g, '').trim();

// Format updated_date:
//   same day   → "5:30 PM"
//   this year  → "Mar 28"
//   older      → "Mar 28, 2024"
const formatUpdatedDate = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

const NoteItem: React.FC<NoteItemProps> = ({ note, isActive, onClick, onDelete }) => {
  const preview = stripHtml(note.content);

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-xl p-3 border cursor-pointer
        transition-all shadow-sm
        ${isActive
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white border-gray-100 hover:bg-gray-50 hover:shadow-md'
        }
      `}
    >
      {/* Title row + delete button */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={`text-sm font-semibold leading-snug truncate flex-1 ${
          isActive ? 'text-blue-900' : 'text-gray-900'
        }`}>
          {note.title || 'Untitled Note'}
        </h3>

        {/* Delete — only visible on hover/active to keep the sidebar clean */}
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
          title="Delete note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Plain-text content preview — 2 lines, no HTML */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
        {preview || <span className="italic text-gray-400">No content yet</span>}
      </p>

      {/* Tag chips + date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 min-w-0">
          {note.tags.map(tag => (
            <span
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
            >
              {tag.name}
            </span>
          ))}
        </div>

        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
          {formatUpdatedDate(note.updated_date)}
        </span>
      </div>
    </div>
  );
};

export default NoteItem;
