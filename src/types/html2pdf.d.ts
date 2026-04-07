/**
 * Type augmentation for html2pdf.js.
 *
 * The published @types/html2pdf.js / bundled type.d.ts omits the `pagebreak`
 * option even though the library supports it at runtime.  This declaration
 * merges the missing property into Html2PdfOptions so TypeScript accepts it.
 *
 * Docs: https://ekoopmans.github.io/html2pdf.js/#page-breaks
 */
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    pagebreak?: {
      /** Strategy for automatic page-break insertion. */
      mode?: ('avoid-all' | 'css' | 'legacy') | ('avoid-all' | 'css' | 'legacy')[];
      /** CSS selectors whose matching elements always get a break *before* them. */
      before?: string | string[];
      /** CSS selectors whose matching elements always get a break *after* them. */
      after?: string | string[];
      /** CSS selectors whose matching elements are never split across pages. */
      avoid?: string | string[];
    };
  }
}
