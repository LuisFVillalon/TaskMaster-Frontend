/**
 * Type augmentation for html2pdf.js.
 *
 * The published type.d.ts omits `pagebreak` even though the library supports
 * it at runtime.  Importing from the target module makes this file a proper
 * ES module, which is the requirement for `declare module` to be treated as
 * an augmentation (merged with the existing declaration) rather than a
 * competing ambient declaration.
 *
 * Docs: https://ekoopmans.github.io/html2pdf.js/#page-breaks
 */
import type {} from 'html2pdf.js';

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    pagebreak?: {
      mode?: ('avoid-all' | 'css' | 'legacy') | ('avoid-all' | 'css' | 'legacy')[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }
}
