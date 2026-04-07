/**
 * Text processing utilities shared across the notes components.
 */

/**
 * Strip all HTML tags from a string and trim whitespace.
 *
 * Used to convert Tiptap HTML note content into plain text for:
 *   - Preview snippets in NoteItem cards
 *   - Minimum-length checks before triggering AI resource fetches
 *
 * @param html - Raw HTML string (e.g. Tiptap output)
 * @returns Plain text with all tags removed
 */
export const stripHtml = (html: string): string =>
  html.replace(/<[^>]+>/g, '').trim();
