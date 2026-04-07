import { Task } from './task';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarSettings {
  id: number;
  title: string;
  sub_header: string;
  start_date: string;
  end_date: string;
}

/** A single event fetched from Google Calendar via the backend proxy. */
export interface GoogleCalendarEvent {
  id: string;
  title: string;
  /** ISO date ("YYYY-MM-DD") for all-day events; ISO datetime for timed events. */
  start: string;
  end: string;
  is_all_day: boolean;
  html_link: string;
  description?: string;
  location?: string;
}

export interface CalendarDay {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}
