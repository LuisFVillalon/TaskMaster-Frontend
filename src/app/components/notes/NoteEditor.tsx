'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapHighlight from '@tiptap/extension-highlight';
import {
  Bold, ChevronDown, ChevronUp, Download, FileText, Highlighter,
  Italic, Library, List, ListOrdered, Loader2,
  PanelLeftClose, PanelLeftOpen, Save,
} from 'lucide-react';
import { Note } from '@/app/types/notes';
import { Tag } from '@/app/types/task';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Defined outside the component so identity is stable across renders. */
const HIGHLIGHT_COLORS = [
  { color: '#fef08a', label: 'Yellow' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#bae6fd', label: 'Blue' },
  { color: '#fbcfe8', label: 'Pink' },
  { color: '#fed7aa', label: 'Orange' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

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

const NoteEditor: React.FC<NoteEditorProps> = ({
  note, allTags, onUpdate,
  showResources = false, onToggleResources,
  sidebarOpen = true, onToggleSidebar,
}) => {
  const [title, setTitle]               = useState(note?.title ?? '');
  const [saveStatus, setSaveStatus]     = useState<'idle' | 'saved'>('idle');
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [emptyToast, setEmptyToast]     = useState(false);
  const [pdfError, setPdfError]         = useState(false);
  const [tagsOpen, setTagsOpen]         = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);

  const contentTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  // Close highlight picker when clicking outside it
  useEffect(() => {
    if (!highlightOpen) return;
    const handler = (e: MouseEvent) => {
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) {
        setHighlightOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [highlightOpen]);

  // ── Editor setup ───────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,

      // Image: base64 data-URIs are stored in note HTML so images survive
      // page reloads without a separate upload service.
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: { class: 'note-img' },
      }),

      // Highlight: multicolor=true lets each mark carry its own background-color.
      TiptapHighlight.configure({ multicolor: true }),
    ],
    content: note?.content ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'notes-editor focus:outline-none min-h-[400px]' },

      // ── Tab indentation ────────────────────────────────────────────────────
      // Insert 4 spaces at the cursor when Tab is pressed outside a list.
      // Inside a list, StarterKit's built-in sink/lift behaviour is preserved
      // by returning false so ProseMirror continues its normal dispatch.
      handleKeyDown(view, event) {
        if (event.key !== 'Tab') return false;

        // Walk up the node ancestry; if any ancestor is a listItem, let
        // StarterKit handle the Tab (sinkListItem / liftListItem).
        const { $from } = view.state.selection;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'listItem') return false;
        }

        event.preventDefault();
        view.dispatch(view.state.tr.insertText('    '));
        return true;
      },

      // ── Image paste ───────────────────────────────────────────────────────
      // Intercept clipboard events that contain an image file, convert to a
      // base64 data-URI, then insert an <img> node into the document.
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imgItem = items.find(i => i.type.startsWith('image/'));
        if (!imgItem) return false;

        event.preventDefault();
        const file = imgItem.getAsFile();
        if (!file) return false;

        const reader = new FileReader();
        reader.onload = readerEvent => {
          const src = readerEvent.target?.result as string;
          if (!src) return;
          const imageNode = view.state.schema.nodes.image;
          if (!imageNode) return;
          view.dispatch(
            view.state.tr.replaceSelectionWith(
              imageNode.create({ src }),
            ),
          );
        };
        reader.readAsDataURL(file);
        return true;
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

  // ── Handlers ───────────────────────────────────────────────────────────────

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

    if (editor.isEmpty) {
      setEmptyToast(true);
      setTimeout(() => setEmptyToast(false), 2500);
      return;
    }

    setPdfLoading(true);

    await new Promise<void>(resolve => setTimeout(resolve, 50));

    const container = document.createElement('div');
    container.style.cssText =
      'position:absolute;top:0;left:-9999px;width:794px;background:#ffffff;color:#1f2937;pointer-events:none;';
    document.body.appendChild(container);

    try {
      const { default: html2pdf } = await import('html2pdf.js');

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

      container.innerHTML = `
        <style>
          /* ── Foundation ──────────────────────────────────────────────────── */
          .pdf-root, .pdf-body { display: block; }
          .pdf-root {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 13px;
            padding: 0;
            color: #1f2937;
            background: #ffffff;
          }

          /* ── Document title ──────────────────────────────────────────────── */
          .pdf-title {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: #111827;
            margin: 0 0 6px;
            line-height: 1.2;
            letter-spacing: -0.3px;
          }
          .pdf-divider { border: none; border-top: 2px solid #e5e7eb; margin: 0 0 20px; }

          /* ── Headings ────────────────────────────────────────────────────── */
          /* H1 = major section (Part 1 / Part 2 etc.) — left-accent block */
          .pdf-body h1 {
            font-size: 17px;
            font-weight: 700;
            color: #111827;
            margin: 24px 0 10px;
            line-height: 1.3;
            break-after: avoid; page-break-after: avoid;
            break-inside: avoid; page-break-inside: avoid;
          }
          /* H2 = subsection — lighter weight, no accent block */
          .pdf-body h2 {
            font-size: 14px;
            font-weight: 700;
            color: #374151;
            margin: 18px 0 6px;
            line-height: 1.3;
            break-after: avoid; page-break-after: avoid;
            break-inside: avoid; page-break-inside: avoid;
          }

          /* ── Body text ───────────────────────────────────────────────────── */
          /* line-height: 1.5 is the stable baseline for html2canvas inline
             rendering — values above ~1.6 split leading unevenly and cause
             inline background boxes to float above their text glyphs.        */
          .pdf-body {
            position: relative; /* containing block for static inline children */
          }
          .pdf-body p {
            font-size: 13px;
            color: #374151;
            line-height: 1.5;
            margin: 0 0 10px;
            break-inside: avoid; page-break-inside: avoid;
            orphans: 3; widows: 3;
          }
          .pdf-body strong { font-weight: 700; color: #111827; }
          .pdf-body em     { font-style: italic; color: #4b5563; }

          /* ── Lists — flexbox injected via DOM post-processing ────────────── */
          /* Native list markers are removed; explicit .pdf-list-marker spans   */
          /* are inserted by the JS below so html2canvas can render them.       */
          .pdf-body ul,
          .pdf-body ol {
            list-style: none;
            padding: 0;
            margin: 0 0 12px;
            break-inside: avoid; page-break-inside: avoid;
          }
          .pdf-body li {
            display: flex;
            align-items: baseline;
            margin-bottom: 5px;
            break-inside: avoid; page-break-inside: avoid;
            orphans: 3; widows: 3;
          }
          /* Fixed-width marker column — number/bullet never overlaps text */
          .pdf-list-marker {
            flex-shrink: 0;
            width: 22px;
            padding-right: 6px;
            box-sizing: border-box;
            color: #6b7280;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.75;
            text-align: right;
          }
          /* Text column wraps independently; nested lists indent naturally */
          .pdf-list-text {
            flex: 1;
            min-width: 0;
          }
          .pdf-list-text p { margin: 0; }
          /* Nested list indent */
          .pdf-list-text ul,
          .pdf-list-text ol { margin: 4px 0 4px 8px; }

          /* ── Highlights ──────────────────────────────────────────────────── */
          .pdf-body mark {
            display: inline;
            background: #fef3c7;
            color: #92400e;
            border-radius: 2px;
            /* em-based padding scales with the 13px font size:
               0.2em ≈ 2.6px top/bottom, 0.4em ≈ 5.2px left/right            */
            padding: 0.2em 0.4em;
            /* line-height: 1 collapses the inline box to exactly the cap-height
               of the glyph. html2canvas then draws the background rectangle
               flush with the text instead of inheriting the parent's 1.5
               line-height and splitting the extra leading above the characters. */
            line-height: 1;
            /* box-decoration-break: clone applies padding + border-radius to
               every wrapped fragment, not just the start and end of the mark. */
            -webkit-box-decoration-break: clone;
            box-decoration-break: clone;
            /* position: static (browser default) keeps the mark in normal flow;
               the parent's position: relative acts as the containing block.   */
            position: static;
          }

          /* ── Source / inline code ────────────────────────────────────────── */
          /* Subtle grey monospace so references don't compete with body text */
          .pdf-body code,
          .pdf-body sup {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10px;
            color: #9ca3af;
            background: #f3f4f6;
            padding: 1px 3px;
            border-radius: 2px;
            vertical-align: super;
            line-height: 1;
          }

          /* ── Blockquote ──────────────────────────────────────────────────── */
          .pdf-body blockquote {
            border-left: 3px solid #d1d5db;
            padding: 4px 12px;
            color: #6b7280;
            margin: 10px 0;
            font-style: italic;
            break-inside: avoid; page-break-inside: avoid;
          }

          /* ── Images ──────────────────────────────────────────────────────── */
          .pdf-body img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 8px 0;
            display: block;
          }
        </style>
        <div class="pdf-root">
          <h1 class="pdf-title">${title || 'Untitled Note'}</h1>
          <hr class="pdf-divider" />
          <div class="pdf-body">${editor.getHTML()}</div>
        </div>
      `;

      // ── List post-processing ─────────────────────────────────────────────
      // html2canvas cannot reliably render CSS counter() values in ::before
      // pseudo-elements, so we inject explicit marker <span>s into each <li>
      // and let flexbox handle the fixed-column / text-wrap layout.
      //
      // Lists are processed innermost-first (reverse document order) so that
      // nested <ul>/<ol> are already transformed before their parent <li>
      // moves them into a .pdf-list-text wrapper.
      const pdfBody = container.querySelector('.pdf-body');
      if (pdfBody) {
        const allLists = Array.from(pdfBody.querySelectorAll('ul, ol')).reverse();
        allLists.forEach(list => {
          const isOrdered = list.tagName === 'OL';
          let counter = 0;
          Array.from(list.children).forEach(child => {
            if (child.tagName !== 'LI') return;
            counter++;

            const marker = document.createElement('span');
            marker.className = 'pdf-list-marker';
            marker.textContent = isOrdered ? `${counter}.` : '•';

            const textWrap = document.createElement('span');
            textWrap.className = 'pdf-list-text';
            // Drain all existing children into the text wrapper first,
            // then append marker + wrapper to keep DOM order intact.
            while (child.firstChild) textWrap.appendChild(child.firstChild);
            child.appendChild(marker);
            child.appendChild(textWrap);
          });
        });
      }

      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const pdfRoot = container.querySelector('.pdf-root') as HTMLElement | null;
      console.log('[PDF export] container offset:', container.offsetWidth, '×', container.offsetHeight);
      console.log('[PDF export] .pdf-root offset:', pdfRoot?.offsetWidth, '×', pdfRoot?.offsetHeight);

      if (!pdfRoot) throw new Error('[PDF export] .pdf-root element not found');

      const pdfOptions: PdfOptions = {
        margin: [14, 14, 14, 14],
        filename,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 794,
          onclone: (clonedDoc: Document) => {
            clonedDoc
              .querySelectorAll('head > link[rel="stylesheet"], head > style')
              .forEach(node => node.parentNode?.removeChild(node));
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] },
      };

      try {
        await html2pdf().set(pdfOptions).from(pdfRoot).save();
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
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--tm-surface)' }}>
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
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
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

  // ── Render ─────────────────────────────────────────────────────────────────

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
        {/* Sidebar toggle */}
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
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="hidden sm:block w-px h-5 mx-1 shrink-0" style={{ backgroundColor: 'var(--tm-border)' }} />
          </>
        )}

        {/* Bold / Italic */}
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

        {/* Headings */}
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

        {/* Lists */}
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

        <div className="w-px h-5 mx-1 shrink-0" style={{ backgroundColor: 'var(--tm-border)' }} />

        {/* ── Highlight colour picker ───────────────────────────────────── */}
        {/*
          The entire widget (trigger button + popover) shares one ref so the
          outside-click handler can tell whether a click originated inside it.
        */}
        <div ref={highlightPickerRef} className="relative">
          <ToolbarBtn
            onClick={() => setHighlightOpen(v => !v)}
            active={editor?.isActive('highlight') ?? false}
            title="Highlight text"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarBtn>

          {highlightOpen && (
            <div
              className="absolute top-full left-0 mt-1.5 p-2 rounded-xl shadow-lg z-50 flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--tm-surface-raised)',
                border: '1px solid var(--tm-border)',
              }}
            >
              {/* Colour swatches */}
              {HIGHLIGHT_COLORS.map(({ color, label }) => {
                const isActive = editor?.isActive('highlight', { color }) ?? false;
                return (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault();
                      if (isActive) {
                        editor?.chain().focus().unsetHighlight().run();
                      } else {
                        editor?.chain().focus().setHighlight({ color }).run();
                      }
                      setHighlightOpen(false);
                    }}
                    title={label}
                    className="w-6 h-6 rounded-md transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: color,
                      outline: isActive ? '2px solid var(--tm-accent)' : '2px solid transparent',
                      outlineOffset: '1px',
                    }}
                  />
                );
              })}

              {/* Divider */}
              <div className="w-px h-4 mx-0.5 shrink-0" style={{ backgroundColor: 'var(--tm-border)' }} />

              {/* Remove highlight */}
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  editor?.chain().focus().unsetHighlight().run();
                  setHighlightOpen(false);
                }}
                title="Remove highlight"
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  color: 'var(--tm-text-muted)',
                  border: '1px solid var(--tm-border)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--tm-surface)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right-side actions */}
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
                    {note.tags.slice(0, 5).map(t => (
                      <span
                        key={t.id}
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      />
                    ))}
                    {note.tags.length > 5 && <span>+{note.tags.length - 5}</span>}
                  </span>
                )
                : 'Add tags'
            )}
          </button>

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

      {/* ── Editor styles ─────────────────────────────────────────────────── */}
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

        /* Highlight marks */
        .notes-editor mark {
          border-radius: 3px;
          padding: 0 2px;
          /* color is inherited so text stays legible on any bg */
        }

        /* Pasted / inserted images */
        .notes-editor .note-img,
        .notes-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.75rem 0;
          display: block;
          /* Subtle ring so images don't float invisibly on white */
          box-shadow: 0 0 0 1px var(--tm-border-subtle);
        }

        /* Selected image state */
        .notes-editor img.ProseMirror-selectednode {
          outline: 2px solid var(--tm-accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default NoteEditor;
