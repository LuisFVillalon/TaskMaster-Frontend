'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, ChevronDown, ChevronUp, Download, FileText, Italic, Library, List, ListOrdered, Loader2, PanelLeftClose, PanelLeftOpen, Save } from 'lucide-react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';

interface NoteEditorProps {
  note: Note | null;
  allTags: Tag[];
  onUpdate: (id: number, changes: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void;
  showResources?: boolean;
  onToggleResources?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
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

const NoteEditor: React.FC<NoteEditorProps> = ({ note, allTags, onUpdate, showResources = false, onToggleResources, sidebarOpen = true, onToggleSidebar }) => {
  const [title, setTitle] = useState(note?.title ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emptyToast, setEmptyToast] = useState(false);
  const [pdfError, setPdfError] = useState(false);
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

    // Yield so React can paint the loading spinner before the main thread
    // is blocked by the canvas rendering work.
    await new Promise<void>(resolve => setTimeout(resolve, 50));

    // ── Off-screen mount ──────────────────────────────────────────────────
    // html2canvas internally calls getBoundingClientRect() and then does
    // ctx.translate(-rect.left, -rect.top) so that the element's top-left
    // corner maps to (0, 0) in the canvas.  A NEGATIVE top value (e.g.
    // top: -10000px) shifts the translate to +10000, pushing all content
    // past the right/bottom edge of the canvas and producing a blank frame.
    // Keeping top: 0 and moving only left off-screen avoids that problem.
    // background + color ensure no oklch values are inherited for these
    // two properties, which html2canvas reads before the onclone sweep.
    const container = document.createElement('div');
    container.style.cssText =
      'position:absolute;top:0;left:-9999px;width:794px;background:#ffffff;color:#1f2937;pointer-events:none;';
    document.body.appendChild(container);

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
      // The <style> lives in <body> (inside container) so the onclone sweep
      // of head > style leaves it intact.
      container.innerHTML = `
        <style>
          /* ── Base layout ──────────────────────────────────────────────────── */
          /* Force block display — flex/grid containers confuse html2canvas's
             page-break measurements and can cause mis-aligned slice boundaries. */
          .pdf-root, .pdf-body { display: block; }
          .pdf-root  { font-family: Georgia, serif; padding: 0; color: #1f2937; background: #ffffff; }
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
          .pdf-body p,
          .pdf-body li,
          .pdf-body blockquote,
          .pdf-body pre {
            break-inside:      avoid;
            page-break-inside: avoid;
          }
          .pdf-body p,
          .pdf-body li {
            orphans: 3;
            widows:  3;
          }
          .pdf-body h1,
          .pdf-body h2 {
            break-after:      avoid;
            page-break-after: avoid;
            break-inside:      avoid;
            page-break-inside: avoid;
          }
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

      // Wait for the browser to perform layout on the newly-injected HTML
      // before html2canvas reads dimensions.  Two rAF calls guarantee that
      // both the style recalc pass and the layout pass have completed.
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );

      // ── Dimension diagnostics ─────────────────────────────────────────
      const pdfRoot = container.querySelector('.pdf-root') as HTMLElement | null;
      const rect    = container.getBoundingClientRect();
      console.log('[PDF export] container BoundingClientRect:', rect);
      console.log('[PDF export] container offset:', container.offsetWidth, '×', container.offsetHeight);
      console.log('[PDF export] .pdf-root offset:', pdfRoot?.offsetWidth, '×', pdfRoot?.offsetHeight);
      console.log('[PDF export] editor HTML length:', editor.getHTML().length);

      if (!pdfRoot) throw new Error('[PDF export] .pdf-root element not found');

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
          windowWidth: 794,
          // Tailwind v4 defines its entire color palette using oklch(), which
          // html2canvas's color parser cannot handle — causing it to hang.
          // Stripping every head-level stylesheet from the cloned document
          // before rendering leaves only our container's embedded <style>
          // (which lives in <body> and survives this sweep), ensuring all
          // colors resolve to plain hex values that html2canvas can parse.
          onclone: (clonedDoc: Document) => {
            clonedDoc
              .querySelectorAll('head > link[rel="stylesheet"], head > style')
              .forEach(node => node.parentNode?.removeChild(node));
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // 'avoid-all' measures every element's bounding box before slicing
        // and pushes any element that would be cut to the top of the next page.
        pagebreak: { mode: ['avoid-all'] },
      };

      // Pass pdfRoot (not the outer container) so html2canvas measures only
      // the visible content div — the sibling <style> tag would add zero
      // layout height but can confuse some versions of html2canvas.
      try {
        await html2pdf()
          .set(pdfOptions)
          .from(pdfRoot)
          .save();
      } catch (err) {
        console.error('[PDF export] html2pdf error:', err);
        setPdfError(true);
        setTimeout(() => setPdfError(false), 3000);
      }
    } finally {
      document.body.removeChild(container);
      setPdfLoading(false);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!note) {
    return (
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--tm-surface)' }}
      >
        {onToggleSidebar && (
          <div
            className="hidden sm:flex items-center gap-0.5 px-4 py-2 border-b border-border-subtle shrink-0"
            style={{ backgroundColor: 'var(--tm-surface-raised)' }}
          >
            <button
              type="button"
              onClick={onToggleSidebar}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="flex px-2 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--tm-text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--tm-surface-raised)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--tm-text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--tm-text-secondary)';
              }}
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-4 h-4" />
                : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
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
        {/* Sidebar toggle — desktop only */}
        {onToggleSidebar && (
          <>
            <button
              type="button"
              onClick={onToggleSidebar}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="hidden sm:flex px-2 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--tm-text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--tm-surface-raised)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--tm-text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--tm-text-secondary)';
              }}
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-4 h-4" />
                : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="hidden sm:block w-px h-5 mx-1 shrink-0" style={{ backgroundColor: 'var(--tm-border)' }} />
          </>
        )}

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

      {/* ── Toasts ───────────────────────────────────────────────────────── */}
      {emptyToast && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium shadow-lg pointer-events-none"
          style={{ backgroundColor: 'var(--tm-surface-raised)', color: 'var(--tm-text-secondary)', border: '1px solid var(--tm-border)' }}
        >
          Note is empty — add some content first.
        </div>
      )}
      {pdfError && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium shadow-lg pointer-events-none"
          style={{ backgroundColor: 'var(--tm-danger-subtle)', color: 'var(--tm-danger)', border: '1px solid var(--tm-danger)' }}
        >
          PDF export failed — please try again.
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
