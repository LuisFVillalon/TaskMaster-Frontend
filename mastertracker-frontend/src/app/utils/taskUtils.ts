/*
Purpose: This file contains utility functions for formatting and processing task-related data, including date/time formatting, color determination, and statistics calculation.

Variables Summary:
- formatDueTime: Function to format time strings or Date objects into readable time format.
- formatDueDate: Function to format dates into relative terms like "Today", "Tomorrow", or specific dates.
- getDueDateColor: Function to determine text color based on due date urgency.
- getTaskDateTime: Function to get a timestamp for sorting tasks by due date/time.
- countTasksByTag: Function to count occurrences of each tag across tasks.

These utilities are used throughout the application for displaying and sorting task information.
*/

import { Task } from '@/app/types/task';

export const formatDueTime = (
  time: string | Date | null | undefined
): string => {
  if (!time) return '';

  // If it's a string like "14:30"
  if (typeof time === 'string') {
    const [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) return time;

    const date = new Date();
    date.setHours(hours, minutes, 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // If it's a Date object
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDueDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'No date';

  let dueDate: Date;

  if (typeof date === 'string') {
    // Force LOCAL date instead of UTC
    const [year, month, day] = date.split('-').map(Number);
    dueDate = new Date(year, month - 1, day);
  } else {
    dueDate = new Date(date);
  }

  if (isNaN(dueDate.getTime())) return 'Invalid date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const oneDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((dueDate.getTime() - today.getTime()) / oneDay);

  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';

  return dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export const getDueDateColor = (date: string | Date | null | undefined, completed: boolean): string => {
  if (completed) return 'text-gray-400';
  if (!date) return 'text-gray-500';

  const dueDate = typeof date === 'string' ? new Date(date) : date;

  // Check for invalid date
  if (isNaN(dueDate.getTime())) return 'text-gray-500';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return 'text-red-500';
  if (diff <= 1) return 'text-orange-500';
  return 'text-gray-500';
};

export const getTaskDateTime = (task: Task): number => {
  // If no due date at all → push to end
  if (!task.due_date) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Normalize date
  const dateStr =
    typeof task.due_date === 'string'
      ? task.due_date
      : task.due_date instanceof Date
      ? task.due_date.toISOString().split('T')[0]
      : null;

  if (!dateStr) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Normalize time (optional)
  const timeStr =
    typeof task.due_time === 'string'
      ? task.due_time
      : task.due_time instanceof Date
      ? task.due_time.toTimeString().slice(0, 5)
      : '23:59'; // no time → end of day

  const timestamp = new Date(`${dateStr}T${timeStr}`).getTime();

  return isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

export const countTasksByTag = (tasks: Task[]) => {
  const map: Record<number, { name: string; color: string; count: number }> = {};

  tasks.forEach(task => {
    task.tags?.forEach(tag => {
      if (!map[tag.id]) {
        map[tag.id] = {
          name: tag.name,
          color: tag.color,
          count: 0
        };
      }
      map[tag.id].count += 1;
    });
  });

  return Object.values(map);
};