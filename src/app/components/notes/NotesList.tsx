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

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border-subtle"
        style={{ backgroundColor: 'var(--tm-surface)' }}
      >
        <h2 className="text-lg font-bold text-text-primary">Notes</h2>
        <button onClick={onNewNote} className="btn btn-primary px-3 py-1.5 text-sm gap-1.5">
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes…"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* ── Tag filter chips ─────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          <button
            onClick={onClearTags}
            className="chip font-medium transition-colors px-2 rounded-md"
            style={selectedTags.length === 0 ? {
              backgroundColor: 'var(--tm-accent)',
              color: 'var(--tm-accent-text)',
            } : {
              backgroundColor: 'var(--tm-surface-raised)',
              color: 'var(--tm-text-secondary)',
            }}
          >
            All
          </button>

          {allTags.map(tag => {
            const isSelected = selectedTags.some(t => t.id === tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag)}
                className="chip font-medium transition-all active:scale-95 px-2 rounded-md"
                style={isSelected ? {
                  backgroundColor: tag.color,
                  color: 'white',
                } : {
                  backgroundColor: 'var(--tm-surface-raised)',
                  color: 'var(--tm-text-secondary)',
                }}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Note list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-2 scrollbar-custom">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: 'var(--tm-surface-raised)' }}
            >
              <FileText className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              {searchTerm || selectedTags.length > 0 ? 'No notes match your filters' : 'No notes yet'}
            </p>
            {!searchTerm && selectedTags.length === 0 && (
              <p className="text-xs text-text-muted mt-1">Click New Note to get started</p>
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
