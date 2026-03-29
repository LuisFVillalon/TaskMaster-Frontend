import { useState, useMemo } from 'react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Creates a new blank note, prepends it to the list, and returns it so the
  // caller can immediately select it for editing.
  const addNote = (title = 'Untitled Note'): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: Math.max(0, ...notes.map(n => n.id)) + 1,
      title,
      content: '',
      tags: [],
      created_date: now,
      updated_date: now,
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  // Accepts a partial update of title, content, or tags.
  // Always refreshes updated_date so the sidebar sort stays correct.
  const updateNote = (
    id: number,
    changes: Partial<Pick<Note, 'title' | 'content' | 'tags'>>,
  ) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, ...changes, updated_date: new Date().toISOString() }
          : note,
      ),
    );
  };

  const deleteNote = (id: number) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  // Derived filtered list — recomputed only when notes, selectedTags, or
  // searchTerm change. AND semantics for tags: note must have every selected
  // tag (mirrors the task filter behaviour in useTaskFiltering).
  const filteredNotes = useMemo(() => {
    let result = notes;

    if (selectedTags.length > 0) {
      result = result.filter(note =>
        selectedTags.every(st => note.tags.some(nt => nt.id === st.id)),
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
    addNote,
    updateNote,
    deleteNote,
    selectedTags,
    setSelectedTags,
    searchTerm,
    setSearchTerm,
  };
};
