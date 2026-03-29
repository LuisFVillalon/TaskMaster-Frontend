'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useNotes } from '@/app/hooks/useNotes';
import { useTags } from '@/app/hooks/useTasksAndTags';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';

interface NotesViewProps {
  isDemo?: boolean;
}

const NotesView: React.FC<NotesViewProps> = ({ isDemo = false }) => {
  const {
    notes,
    filteredNotes,
    addNote,
    updateNote,
    deleteNote,
    selectedTags,
    setSelectedTags,
    searchTerm,
    setSearchTerm,
  } = useNotes();

  const { tags } = useTags(isDemo);

  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  // Look up the active note in the full (unfiltered) notes array so it stays
  // visible in the editor even when the sidebar tag filter hides it.
  const activeNote: Note | null = notes.find(n => n.id === activeNoteId) ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setMobileView('editor');
  };

  const handleNewNote = () => {
    const created = addNote();
    setActiveNoteId(created.id);
    setMobileView('editor');
  };

  const handleDeleteNote = (id: number) => {
    deleteNote(id);
    if (activeNoteId === id) {
      // Select the first remaining note; if none left, clear the editor.
      const remaining = notes.filter(n => n.id !== id);
      const next = remaining[0] ?? null;
      setActiveNoteId(next?.id ?? null);
      if (!next) setMobileView('list');
    }
  };

  const handleTagToggle = (tag: Tag) => {
    setSelectedTags(prev =>
      prev.some(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag],
    );
  };

  const handleClearTags = () => setSelectedTags([]);

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#EFE7DD] flex flex-col">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Tasks
        </Link>
        <span className="text-gray-300 select-none">/</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notes</h1>
      </div>

      {/* ── 2-panel container ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6 min-h-0">
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex"
          style={{ height: 'calc(100vh - 96px)' }}
        >
          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          {/* Hidden on mobile when the editor is open */}
          <div
            className={`w-72 flex-shrink-0 border-r border-gray-100 flex-col ${
              mobileView === 'editor' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <NotesList
              notes={filteredNotes}
              activeNoteId={activeNoteId}
              allTags={tags}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearTags={handleClearTags}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectNote={handleSelectNote}
              onNewNote={handleNewNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>

          {/* ── Editor panel ────────────────────────────────────────────── */}
          {/* Hidden on mobile when the list is shown */}
          <div
            className={`flex-1 flex-col min-w-0 ${
              mobileView === 'list' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Mobile back button — only rendered on small screens */}
            <button
              onClick={() => setMobileView('list')}
              className="sm:hidden flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border-b border-gray-100 bg-gray-50 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              All Notes
            </button>

            <NoteEditor
              note={activeNote}
              allTags={tags}
              onUpdate={updateNote}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesView;
