'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, ChevronDown, ChevronUp, Download, FileText, Italic, Library, List, ListOrdered, Loader2, Save } from 'lucide-react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';

interface NoteEditorProps {
  note: Note | null;
  allTags: Tag[];
  onUpdate: (id: number, changes: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void;
  showResources?: boolean;
  onToggleResources?: () => void;
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
    className="px-2 py-1.5 rounded-lg text-sm transition-colors"
    style={active ? {
      backgroundColor: 'var(--tm-accent-subtle)',
      color: 'var(--tm-accent)',
    } : {
      color: 'var(--tm-text-secondary)',
    }}
    onMouseEnter={e => {
      if (!active) {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--tm-surface-raised)';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
      }
    }}
  >
    {children}
  </button>
);

// ─── NoteEditor ───────────────────────────────────────────────────────────────

const NoteEditor: React.FC<NoteEditorProps> = ({ note, allTags, onUpdate, showResources = false, onToggleResources }) => {
  const [title, setTitle] = useState(note?.title ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emptyToast, setEmptyToast] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

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

  // Sync to active note — cancel in-flight debounces, update title + editor content.
  useEffect(() => {
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (titleTimer.current)   clearTimeout(titleTimer.current);
    setTitle(note?.title ?? '');
    setSaveStatus('idle');
    if (editor) {
      editor.commands.setContent(note?.content ?? '');
    }
  // `editor` excluded intentionally — setContent is imperative, not reactive.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  useEffect(() => {
    return () => {
      if (contentTimer.current) clearTimeout(contentTimer.current);
      if (titleTimer.current)   clearTimeout(titleTimer.current);
      if (savedTimer.current)   clearTimeout(savedTimer.current);
    };
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!note) return;
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      onUpdate(note.id, { title: value });
    }, 500);
  };

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
      tags: exists ? note.tags.filter(t => t.id !== tag.id) : [...note.tags, tag],
    });
  };

  const handleDownloadPDF = async () => {
    if (!note || !editor) return;

    // Guard: treat editor as empty if only whitespace / empty paragraph remains
    if (editor.isEmpty) {
      setEmptyToast(true);
      setTimeout(() => setEmptyToast(false), 2500);
      return;
    }

    setPdfLoading(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');

      // Html2PdfOptions in the published type.d.ts omits `pagebreak` even
      // though the library supports it.  We define a local extension so
      // TypeScript accepts the option without resorting to `as any`.
      //
      // ReturnType / InstanceType<typeof html2pdf> both resolve to Promise<void>
      // because TypeScript picks the *last* overload.  The Html2PdfStatic.Worker
      // property is a single-signature constructor (new () => Html2PdfWorker), so
      // InstanceType of *that* reliably gives us Html2PdfWorker and its set() type.
      type PdfOptions = Parameters<InstanceType<(typeof html2pdf)['Worker']>['set']>[0] & {
        pagebreak?: {
          mode?:   ('avoid-all' | 'css' | 'legacy') | ('avoid-all' | 'css' | 'legacy')[];
          before?: string | string[];
          after?:  string | string[];
          avoid?:  string | string[];
        };
      };

      const today = new Date().toISOString().split('T')[0];
      const safeTitle = (title || 'Note')
        .replace(/[<>:"/\\|?*]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, 80);
      const filename = `${safeTitle}_${today}.pdf`;

      // Build a styled container — hard-coded colors so html2canvas
      // doesn't inherit unresolved CSS custom properties from the dark theme.
      const container = document.createElement('div');
      container.innerHTML = `
        <style>
          /* ── Base layout ──────────────────────────────────────────────────── */
          /* Force block display — flex/grid containers confuse html2canvas's
             page-break measurements and can cause mis-aligned slice boundaries. */
          .pdf-root, .pdf-body { display: block; }
          .pdf-root  { font-family: Georgia, serif; padding: 0; color: #1f2937; }
          .pdf-title { font-size: 26px; font-weight: 700; color: #111827; margin: 0 0 18px; line-height: 1.25; }
          .pdf-divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 0 18px; }

          /* ── Typography ───────────────────────────────────────────────────── */
          .pdf-body h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 18px 0 6px; line-height: 1.2; }
          .pdf-body h2 { font-size: 16px; font-weight: 700; color: #111827; margin: 14px 0 4px; line-height: 1.3; }
          .pdf-body p  { font-size: 13px; color: #374151; line-height: 1.75; margin: 0 0 10px; }
          .pdf-body ul, .pdf-body ol { padding-left: 22px; margin: 0 0 10px; color: #374151; }
          .pdf-body li { font-size: 13px; line-height: 1.65; margin-bottom: 4px; }
          .pdf-body strong    { font-weight: 700; color: #111827; }
          .pdf-body em        { font-style: italic; }
          .pdf-body blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 8px 0; }
          .pdf-body code      { font-family: monospace; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 12px; }

          /* ── Page-break prevention ────────────────────────────────────────── */
          /* Paragraphs and list items: never slice a line in half. */
          .pdf-body p,
          .pdf-body li,
          .pdf-body blockquote,
          .pdf-body pre {
            break-inside:      avoid;   /* modern spec */
            page-break-inside: avoid;   /* legacy webkit fallback */
          }

          /* Widows/orphans: require at least 3 lines at page top and bottom,
             preventing single "orphan" or "widow" lines being left alone. */
          .pdf-body p,
          .pdf-body li {
            orphans: 3;
            widows:  3;
          }

          /* Headings: keep the heading on the same page as the content that
             follows it — never leave a heading stranded at the bottom of a page. */
          .pdf-body h1,
          .pdf-body h2 {
            break-after:      avoid;
            page-break-after: avoid;
            break-inside:      avoid;
            page-break-inside: avoid;
          }

          /* List blocks: keep the whole list together when it fits on one page. */
          .pdf-body ul,
          .pdf-body ol {
            break-inside:      avoid;
            page-break-inside: avoid;
          }
        </style>
        <div class="pdf-root">
          <h1 class="pdf-title">${title || 'Untitled Note'}</h1>
          <hr class="pdf-divider" />
          <div class="pdf-body">${editor.getHTML()}</div>
        </div>
      `;

      // Stored in a variable so TypeScript applies excess-property checking
      // against PdfOptions (which includes pagebreak) rather than against
      // Html2PdfOptions (which doesn't), avoiding a TS2353 build error.
      const pdfOptions: PdfOptions = {
        margin: [14, 14, 14, 14],
        filename,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          // Lock the render viewport to A4 width at 96 dpi (794 px).
          // Without this, html2canvas uses the live browser window width,
          // which makes page-slice boundaries land at unpredictable positions
          // relative to the text lines.
          windowWidth: 794,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // 'avoid-all' measures every element's bounding box before slicing
        // and pushes any element that would be cut to the top of the next page.
        // This is the primary safeguard against horizontal text clipping.
        pagebreak: { mode: ['avoid-all'] },
      };

      await html2pdf()
        .set(pdfOptions)
        .from(container)
        .save();
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!note) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: 'var(--tm-surface)' }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--tm-surface-raised)' }}
          >
            <FileText className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-muted mb-1">No note selected</h3>
          <p className="text-sm text-text-muted">Select a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative"
      style={{ backgroundColor: 'var(--tm-surface)' }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0.5 px-4 py-2 border-b border-border-subtle flex-wrap"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
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

        <div className="w-px h-5 mx-1 shrink-0" style={{ backgroundColor: 'var(--tm-border)' }} />

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

        <div className="w-px h-5 mx-1 shrink-0" style={{ backgroundColor: 'var(--tm-border)' }} />

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

        {/* Download PDF + Smart Resources + Save — pushed to the far right */}
        <div className="ml-auto flex items-center gap-2">
          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            title="Download as PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'var(--tm-text-secondary)' }}
            onMouseEnter={e => {
              if (!pdfLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--tm-surface-raised)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            }}
          >
            {pdfLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{pdfLoading ? 'Exporting…' : 'PDF'}</span>
          </button>

          {onToggleResources && (
            <button
              type="button"
              onClick={onToggleResources}
              title={showResources ? 'Hide Smart Resources' : 'Show Smart Resources'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={showResources ? {
                backgroundColor: 'var(--tm-accent-subtle)',
                color: 'var(--tm-accent)',
              } : {
                color: 'var(--tm-text-secondary)',
              }}
              onMouseEnter={e => {
                if (!showResources) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--tm-surface-raised)';
              }}
              onMouseLeave={e => {
                if (!showResources) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              }}
            >
              <Library className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resources</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="btn flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
            style={saveStatus === 'saved' ? {
              backgroundColor: 'var(--tm-success-subtle)',
              color: 'var(--tm-success)',
            } : {
              backgroundColor: 'var(--tm-accent)',
              color: 'var(--tm-accent-text)',
            }}
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
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <div className="px-6 sm:px-10 pt-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Untitled Note"
          className="w-full text-2xl sm:text-3xl font-bold text-text-primary placeholder-text-muted focus:outline-none bg-transparent"
        />
      </div>

      {/* ── Tag picker (collapsible) ──────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="px-6 sm:px-10 pb-3">
          {/* Toggle row */}
          <button
            type="button"
            onClick={() => setTagsOpen(v => !v)}
            aria-expanded={tagsOpen}
            aria-controls="note-tag-picker"
            className="flex items-center gap-1.5 text-xs font-medium mb-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--tm-text-muted)' }}
          >
            {tagsOpen
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}

            {tagsOpen ? 'Hide tags' : (
              note.tags.length > 0
                ? (
                  <span className="flex items-center gap-1.5">
                    <span>Tags</span>
                    {/* Colour dots for selected tags */}
                    {note.tags.slice(0, 5).map(t => (
                      <span
                        key={t.id}
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      />
                    ))}
                    {note.tags.length > 5 && (
                      <span>+{note.tags.length - 5}</span>
                    )}
                  </span>
                )
                : 'Add tags'
            )}
          </button>

          {/* Expandable grid */}
          <div
            id="note-tag-picker"
            role="region"
            aria-label="Tag picker"
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: tagsOpen ? '160px' : '0px', opacity: tagsOpen ? 1 : 0 }}
          >
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-xl border border-border max-h-36 overflow-y-auto scrollbar-custom"
              style={{ backgroundColor: 'var(--tm-surface-raised)' }}
            >
              {allTags.map(tag => {
                const selected = note.tags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    style={{
                      backgroundColor: selected ? tag.color : 'var(--tm-surface)',
                      color: selected ? '#ffffff' : 'var(--tm-text-primary)',
                      border: `1px solid ${selected ? tag.color : 'var(--tm-border)'}`,
                      transform: selected ? 'scale(1)' : 'scale(0.97)',
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-100 active:scale-95"
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mx-6 sm:mx-10 border-t border-border-subtle" />

      {/* ── Editor body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-4 scrollbar-custom">
        <EditorContent editor={editor} />
      </div>

      {/* ── Empty note toast ─────────────────────────────────────────────── */}
      {emptyToast && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium shadow-lg pointer-events-none transition-opacity"
          style={{ backgroundColor: 'var(--tm-surface-raised)', color: 'var(--tm-text-secondary)', border: '1px solid var(--tm-border)' }}
        >
          Note is empty — add some content first.
        </div>
      )}

      {/* Prose styles scoped to the .notes-editor ProseMirror instance */}
      <style jsx global>{`
        .notes-editor h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--tm-text-primary);
          margin: 1rem 0 0.5rem;
          line-height: 1.2;
        }
        .notes-editor h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--tm-text-primary);
          margin: 0.875rem 0 0.4rem;
          line-height: 1.3;
        }
        .notes-editor p {
          color: var(--tm-text-secondary);
          line-height: 1.7;
          margin-bottom: 0.5rem;
        }
        .notes-editor ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--tm-text-secondary);
        }
        .notes-editor ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--tm-text-secondary);
        }
        .notes-editor li {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        .notes-editor strong {
          font-weight: 700;
          color: var(--tm-text-primary);
        }
        .notes-editor em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default NoteEditor;
