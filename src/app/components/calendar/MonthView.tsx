'use client';

import React, { useMemo } from 'react';
import { Task } from '@/app/types/task';
import { CalendarDay } from '@/app/types/calendar';
import { getTaskDateTime } from '@/app/utils/taskUtils';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MAX_TASKS_VISIBLE = 2;

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  onDayClick: (date: Date) => void;
}

// Builds a local YYYY-MM-DD key from a Date using local timezone methods,
// matching the YYYY-MM-DD strings returned by the backend (Python date serialization).
const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Color priority: completed → gray, first tag color, urgent → orange, default → blue.
const getPillColor = (task: Task): string => {
  if (task.completed) return '#9CA3AF';
  if (task.tags.length > 0) return task.tags[0].color;
  if (task.urgent) return '#F97316';
  return '#3B82F6';
};

// ─── Day Cell ────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: CalendarDay;
  onClick: (date: Date) => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, onClick }) => {
  const visible = day.tasks.slice(0, MAX_TASKS_VISIBLE);
  const overflow = day.tasks.length - MAX_TASKS_VISIBLE;

  return (
    <div
      onClick={() => onClick(day.date)}
      className={`
        min-h-[80px] sm:min-h-[96px] p-1 sm:p-1.5
        border-b border-r border-gray-100
        cursor-pointer transition-colors duration-100
        ${day.isCurrentMonth
          ? 'bg-white hover:bg-blue-50'
          : 'bg-gray-50 hover:bg-gray-100'}
      `}
    >
      {/* Date number — blue filled circle for today, plain text otherwise */}
      <div className="flex justify-end mb-1">
        {day.isToday ? (
          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold leading-none">
            {day.date.getDate()}
          </span>
        ) : (
          <span
            className={`text-xs sm:text-sm font-medium ${
              day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            {day.date.getDate()}
          </span>
        )}
      </div>

      {/* Task pills */}
      <div className="flex flex-col gap-0.5">
        {visible.map(task => (
          <div
            key={task.id}
            style={{ backgroundColor: getPillColor(task) }}
            className="text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate font-medium leading-tight"
            title={task.title}
            // Stop propagation so clicking a pill does not also trigger onDayClick.
            // TODO: wire to onTaskClick → EditTaskModal when that prop is added.
            onClick={e => e.stopPropagation()}
          >
            {task.title}
          </div>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] sm:text-xs text-gray-400 px-1 font-medium">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Month View ───────────────────────────────────────────────────────────────

const MonthView: React.FC<MonthViewProps> = ({ currentDate, tasks, onDayClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group tasks by local YYYY-MM-DD key, skipping tasks with no due_date.
  // Tasks within each day are sorted chronologically via getTaskDateTime.
  const tasksByDate = useMemo<Record<string, Task[]>>(() => {
    const map: Record<string, Task[]> = {};

    tasks.forEach(task => {
      if (!task.due_date) return;

      let key: string | null = null;
      if (typeof task.due_date === 'string') {
        // Handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" variants.
        key = task.due_date.slice(0, 10);
      } else if (task.due_date instanceof Date) {
        key = toDateKey(task.due_date);
      }

      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });

    Object.values(map).forEach(dayTasks =>
      dayTasks.sort((a, b) => getTaskDateTime(a) - getTaskDateTime(b))
    );

    return map;
  }, [tasks]);

  // Build the full 5- or 6-week grid including leading/trailing padding days.
  // JS Date wraps negative and overflow day values across month boundaries
  // automatically, so new Date(year, month, 0) gives the last day of the
  // previous month, new Date(year, month, -1) gives the second-to-last, etc.
  const grid = useMemo<CalendarDay[]>(() => {
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const startPadding = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const date = new Date(year, month, i - startPadding + 1);
      const key = toDateKey(date);
      return {
        date,
        tasks: tasksByDate[key] ?? [],
        isCurrentMonth: date.getMonth() === month,
        isToday:
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate(),
      };
    });
  }, [year, month, tasksByDate]);

  return (
    // overflow-hidden clips the rightmost/bottommost cell borders so the outer
    // container border acts as the calendar edge — no double borders at the seams.
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
        {DAY_HEADERS.map(label => (
          <div
            key={label}
            className="py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {grid.map(day => (
          <DayCell
            key={toDateKey(day.date)}
            day={day}
            onClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
};

export default MonthView;
