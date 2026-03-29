import { Tag } from './task';

export interface Note {
  id: number;
  title: string;
  content: string;       // Tiptap HTML output via editor.getHTML()
  tags: Tag[];
  created_date: string;  // ISO string — matches task date convention
  updated_date: string;
}

export type NoteFilterType = 'all' | 'tagged' | 'untagged';
