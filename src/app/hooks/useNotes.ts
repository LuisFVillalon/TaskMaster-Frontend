import { useState, useEffect, useMemo, useCallback } from 'react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';
import {
  fetchNotes,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
} from '@/app/lib/backend-api';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all notes from the backend once on mount.
  useEffect(() => {
    fetchNotes()
      .then(data => setNotes(data))
      .catch(() => setError('Failed to load notes'))
      .finally(() => setIsLoading(false));
  }, []);

  // Creates a new blank note, persists it, prepends it, and returns it so the
  // caller can immediately select it for editing.
  const addNote = useCallback(async (title = 'Untitled Note'): Promise<Note> => {
    const created = await apiCreateNote({ title, content: '', tags: [] });
    setNotes(prev => [created, ...prev]);
    return created;
  }, []);

  // Accepts a partial update of title, content, or tags.
  // Optimistically updates local state, then syncs to the backend.
  const updateNote = useCallback(
    async (
      id: number,
      changes: Partial<Pick<Note, 'title' | 'content' | 'tags'>>,
    ) => {
      // Optimistic update
      setNotes(prev =>
        prev.map(note =>
          note.id === id
            ? { ...note, ...changes, updated_date: new Date().toISOString() }
            : note,
        ),
      );
      try {
        const updated = await apiUpdateNote(id, changes);
        // Reconcile with the server's authoritative updated_date
        setNotes(prev => prev.map(note => (note.id === id ? updated : note)));
      } catch {
        setError('Failed to save note');
      }
    },
    [],
  );

  const deleteNote = useCallback(async (id: number) => {
    // Optimistic removal
    setNotes(prev => prev.filter(note => note.id !== id));
    try {
      await apiDeleteNote(id);
    } catch {
      setError('Failed to delete note');
    }
  }, []);

  // Derived filtered list — recomputed only when notes, selectedTags, or
  // searchTerm change. AND semantics for tags: note must have every selected
  // tag (mirrors the task filter behaviour in useTaskFiltering).
  const filteredNotes = useMemo(() => {
    let result = notes;

    if (selectedTags.length > 0) {
      result = result.filter(note =>
        selectedTags.some(st => note.tags.some(nt => nt.id === st.id)),
      );
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      // Strip HTML tags for content matching so the search hits visible text,
      // not markup like <strong> or <ul>.
      result = result.filter(
        note =>
          note.title.toLowerCase().includes(lower) ||
          note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(lower),
      );
    }

    return result;
  }, [notes, selectedTags, searchTerm]);

  return {
    notes,
    filteredNotes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    selectedTags,
    setSelectedTags,
    searchTerm,
    setSearchTerm,
  };
};
