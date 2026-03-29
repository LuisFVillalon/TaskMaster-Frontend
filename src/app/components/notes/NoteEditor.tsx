'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, FileText, Save } from 'lucide-react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';

interface NoteEditorProps {
  note: Note | null;
  allTags: Tag[];
  onUpdate: (id: number, changes: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void;
}

// ─── Toolbar button ────────────────────────────────────────────────────────────

interface ToolbarBtnProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={e => {
      // Prevent the editor from losing focus when clicking toolbar buttons.
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`px-2 py-1.5 rounded text-sm transition-colors ${
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

// ─── NoteEditor ───────────────────────────────────────────────────────────────

const NoteEditor: React.FC<NoteEditorProps> = ({ note, allTags, onUpdate }) => {
  const [title, setTitle] = useState(note?.title ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Refs for debounce timers so we can cancel/reset without triggering re-renders.
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note?.content ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'notes-editor focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (!note) return;
      const html = editor.getHTML();
      if (contentTimer.current) clearTimeout(contentTimer.current);
      contentTimer.current = setTimeout(() => {
        onUpdate(note.id, { content: html });
      }, 500);
    },
  });

  // When the active note changes: cancel in-flight debounces, sync title input,
  // reset save indicator, and reload editor content imperatively.
  useEffect(() => {
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (titleTimer.current)   clearTimeout(titleTimer.current);
    setTitle(note?.title ?? '');
    setSaveStatus('idle');
    if (editor) {
      editor.commands.setContent(note?.content ?? '');
    }
  // `editor` is intentionally excluded: setContent is an imperative call, not
  // a reactive dependency. The only trigger we want is a note ID change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  // Clean up all timers on unmount.
  useEffect(() => {
    return () => {
      if (contentTimer.current) clearTimeout(contentTimer.current);
      if (titleTimer.current)   clearTimeout(titleTimer.current);
      if (savedTimer.current)   clearTimeout(savedTimer.current);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!note) return;
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      onUpdate(note.id, { title: value });
    }, 500);
  };

  // Explicit save: flushes both debounces and triggers the "Saved ✓" flash.
  const handleSave = () => {
    if (!note || !editor) return;
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (titleTimer.current)   clearTimeout(titleTimer.current);
    onUpdate(note.id, { title, content: editor.getHTML() });
    setSaveStatus('saved');
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleTagToggle = (tag: Tag) => {
    if (!note) return;
    const exists = note.tags.some(t => t.id === tag.id);
    onUpdate(note.id, {
      tags: exists
        ? note.tags.filter(t => t.id !== tag.id)
        : [...note.tags, tag],
    });
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-400 mb-1">No note selected</h3>
          <p className="text-sm text-gray-400">
            Select a note from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  // ── Editor layout ──────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold') ?? false}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic') ?? false}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive('heading', { level: 1 }) ?? false}
          title="Heading 1"
        >
          <span className="text-xs font-bold leading-none">H1</span>
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 }) ?? false}
          title="Heading 2"
        >
          <span className="text-xs font-bold leading-none">H2</span>
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />

        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList') ?? false}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList') ?? false}
          title="Ordered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        {/* Save — pushed to the far right */}
        <button
          onClick={handleSave}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            saveStatus === 'saved'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {saveStatus === 'saved' ? (
            'Saved ✓'
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save
            </>
          )}
        </button>
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 pt-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Untitled Note"
          className="w-full text-2xl sm:text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent"
        />
      </div>

      {/* ── Tag picker — identical chip pattern to NewTaskModal ──────────── */}
      {allTags.length > 0 && (
        <div className="px-6 sm:px-10 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-36 overflow-y-auto">
            {allTags.map(tag => {
              const selected = note.tags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  style={{
                    backgroundColor: selected ? tag.color : '#F5F1EB',
                    color: selected ? '#ffffff' : '#000000',
                    transform: selected ? 'scale(1)' : 'scale(0.95)',
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-100 active:scale-90"
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-6 sm:mx-10 border-t border-gray-100" />

      {/* ── Editor body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-4">
        <EditorContent editor={editor} />
      </div>

      {/* Prose styles scoped to the .notes-editor ProseMirror instance */}
      <style jsx global>{`
        .notes-editor h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 1rem 0 0.5rem;
          line-height: 1.2;
        }
        .notes-editor h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0.875rem 0 0.4rem;
          line-height: 1.3;
        }
        .notes-editor p {
          color: #374151;
          line-height: 1.7;
          margin-bottom: 0.5rem;
        }
        .notes-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .notes-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .notes-editor li {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        .notes-editor strong {
          font-weight: 700;
          color: #111827;
        }
        .notes-editor em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default NoteEditor;
