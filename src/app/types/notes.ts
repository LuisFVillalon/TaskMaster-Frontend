import { Tag } from './task';

export interface Note {
  id: number;
  title: string;
  content: string;       // Tiptap HTML output via editor.getHTML()
  tags: Tag[];
  created_date: string;  // ISO string — matches task date convention
  updated_date: string;
  /** Supabase Auth UUID — set server-side, never supplied by the client. */
  user_id?: string | null;
}

export type NoteFilterType = 'all' | 'tagged' | 'untagged';
