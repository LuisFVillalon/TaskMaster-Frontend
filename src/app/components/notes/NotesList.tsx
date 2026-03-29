'use client';

import React from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';
import NoteItem from './NoteItem';

interface NotesListProps {
  notes: Note[];
  activeNoteId: number | null;
  allTags: Tag[];
  selectedTags: Tag[];
  onTagToggle: (tag: Tag) => void;
  onClearTags: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onDeleteNote: (id: number) => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  activeNoteId,
  allTags,
  selectedTags,
  onTagToggle,
  onClearTags,
  searchTerm,
  onSearchChange,
  onSelectNote,
  onNewNote,
  onDeleteNote,
}) => {
  return (
    <div className="flex flex-col h-full">

      {/* ── Header: title + new note button ──────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Notes</h2>
        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ── Tag filter chips ─────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {/* "All" clears selection */}
          <button
            onClick={onClearTags}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedTags.length === 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>

          {allTags.map(tag => {
            const isSelected = selectedTags.some(t => t.id === tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag)}
                style={isSelected ? { backgroundColor: tag.color } : {}}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  isSelected
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Note list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {searchTerm || selectedTags.length > 0 ? 'No notes match your filters' : 'No notes yet'}
            </p>
            {!searchTerm && selectedTags.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Click New Note to get started</p>
            )}
          </div>
        ) : (
          notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onClick={() => onSelectNote(note)}
              onDelete={onDeleteNote}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotesList;
