import { Task } from './task';

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarDay {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}
