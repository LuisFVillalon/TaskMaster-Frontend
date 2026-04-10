'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useNotes } from '@/app/hooks/useNotes';
import { useTags } from '@/app/hooks/useTasksAndTags';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import ResourceSidebar from './ResourceSidebar';

interface NotesViewProps {
  // When true the component omits its own page chrome (header, bg wrapper)
  // and uses a constrained height suitable for embedding inside TaskManager.
  embedded?: boolean;
}

const NotesView: React.FC<NotesViewProps> = ({ embedded = false }) => {
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

  const { tags } = useTags();

  const searchParams = useSearchParams();
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const [showResources, setShowResources] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const initialSelectionApplied = useRef(false);

  // Auto-select the note specified in ?id=<noteId> on initial load only.
  // The ref guard ensures this never overrides a manual note selection after
  // the first successful match.
  useEffect(() => {
    if (initialSelectionApplied.current) return;
    const idParam = searchParams.get('id');
    if (!idParam || notes.length === 0) return;
    const id = parseInt(idParam, 10);
    if (!isNaN(id) && notes.some(n => n.id === id)) {
      setActiveNoteId(id);
      setMobileView('editor');
      initialSelectionApplied.current = true;
    }
  }, [notes, searchParams]);

  // Look up the active note in the full (unfiltered) array so it stays
  // visible in the editor even when the sidebar tag filter hides it.
  const activeNote: Note | null = notes.find(n => n.id === activeNoteId) ?? null;

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setMobileView('editor');
  };

  const handleNewNote = async () => {
    const created = await addNote();
    setActiveNoteId(created.id);
    setMobileView('editor');
  };

  const handleDeleteNote = (id: number) => {
    deleteNote(id);
    if (activeNoteId === id) {
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

  // ── Shared 2-panel panel ────────────────────────────────────────────────
  const panel = (
    <div
      className="card overflow-hidden flex"
      style={{ height: embedded ? 'calc(100vh - 280px)' : 'calc(100vh - 96px)', minHeight: '420px' }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${
          mobileView === 'editor' ? 'hidden sm:flex' : 'flex'
        } ${sidebarOpen ? 'border-r border-border-subtle' : ''}`}
        style={{ width: sidebarOpen ? '18rem' : '0' }}
      >
        {/* Inner wrapper keeps content at full width while outer clips it */}
        <div className="min-w-[18rem] flex flex-col flex-1 overflow-hidden">
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
      </div>

      {/* ── Editor panel ────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex-col min-w-0 ${
          mobileView === 'list' ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Mobile back button */}
        <button
          onClick={() => setMobileView('list')}
          className="sm:hidden flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border-b border-border-subtle transition-colors shrink-0"
          style={{ backgroundColor: 'var(--tm-surface-raised)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          All Notes
        </button>

        <NoteEditor
          note={activeNote}
          allTags={tags}
          onUpdate={updateNote}
          showResources={showResources}
          onToggleResources={() => setShowResources(v => !v)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />
      </div>

      {/* ── Smart Resources sidebar ──────────────────────────────────── */}
      {showResources && activeNote && (
        <div className="hidden sm:flex w-72 flex-shrink-0 border-l border-border-subtle flex-col overflow-hidden">
          <ResourceSidebar
            noteContent={activeNote.content}
            onClose={() => setShowResources(false)}
          />
        </div>
      )}
    </div>
  );

  // ── Embedded mode: no page chrome, just the panel ───────────────────────
  if (embedded) {
    return <div className="w-full">{panel}</div>;
  }

  // ── Standalone page mode ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--tm-bg)' }}>
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Tasks
        </Link>
        <span className="text-text-muted select-none">/</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Notes</h1>
      </div>
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6 min-h-0">
        {panel}
      </div>
    </div>
  );
};

export default NotesView;
