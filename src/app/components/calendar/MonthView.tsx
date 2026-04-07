'use client';

import React, { useMemo } from 'react';
import { Task } from '@/app/types/task';
import { CalendarDay, GoogleCalendarEvent } from '@/app/types/calendar';
import { getTaskDateTime } from '@/app/utils/taskUtils';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MAX_ITEMS_VISIBLE = 2;
const GOOGLE_BLUE = '#1a73e8';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  onDayClick: (date: Date) => void;
  googleEvents?: GoogleCalendarEvent[];
  onGoogleEventClick?: (event: GoogleCalendarEvent) => void;
}

// Local YYYY-MM-DD key in local timezone — matches Python backend serialization.
const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Color priority: completed → muted, first tag color, urgent → warning, default → accent.
const getPillColor = (task: Task): string => {
  if (task.completed) return 'var(--tm-text-muted)';
  if (task.tags.length > 0) return task.tags[0].color;
  if (task.urgent) return 'var(--tm-warning)';
  return 'var(--tm-accent)';
};

// ─── Day Cell ────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: CalendarDay;
  googleEventsForDay: GoogleCalendarEvent[];
  onClick: (date: Date) => void;
  onGoogleEventClick?: (event: GoogleCalendarEvent) => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, googleEventsForDay, onClick, onGoogleEventClick }) => {
  // Merge tasks and Google events into one sorted list capped at MAX_ITEMS_VISIBLE.
  const allItems = [
    ...day.tasks.map(t => ({ type: 'task' as const, task: t, gcal: null })),
    ...googleEventsForDay.map(e => ({ type: 'gcal' as const, task: null, gcal: e })),
  ];
  const visible = allItems.slice(0, MAX_ITEMS_VISIBLE);
  const overflow = allItems.length - MAX_ITEMS_VISIBLE;

  return (
    <div
      onClick={() => onClick(day.date)}
      className="min-h-[80px] sm:min-h-[96px] p-1 sm:p-1.5 border-b border-r border-border-subtle cursor-pointer transition-colors duration-100"
      style={{
        backgroundColor: day.isCurrentMonth
          ? 'var(--tm-surface)'
          : 'var(--tm-surface-raised)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--tm-accent-subtle)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = day.isCurrentMonth
          ? 'var(--tm-surface)'
          : 'var(--tm-surface-raised)';
      }}
    >
      {/* Date number */}
      <div className="flex justify-end mb-1">
        {day.isToday ? (
          <span
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold leading-none"
            style={{ backgroundColor: 'var(--tm-accent)', color: 'var(--tm-accent-text)' }}
          >
            {day.date.getDate()}
          </span>
        ) : (
          <span
            className="text-xs sm:text-sm font-medium"
            style={{ color: day.isCurrentMonth ? 'var(--tm-text-primary)' : 'var(--tm-text-muted)' }}
          >
            {day.date.getDate()}
          </span>
        )}
      </div>

      {/* Task + Google event pills */}
      <div className="flex flex-col gap-0.5">
        {visible.map((item, idx) => {
          if (item.type === 'task') {
            const task = item.task!;
            return (
              <div
                key={`t-${task.id}`}
                style={{ backgroundColor: getPillColor(task) }}
                className="text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate font-medium leading-tight"
                title={task.title}
                onClick={e => e.stopPropagation()}
              >
                {task.title}
              </div>
            );
          }
          const gcal = item.gcal!;
          return (
            <div
              key={`g-${gcal.id}-${idx}`}
              style={{ backgroundColor: GOOGLE_BLUE }}
              className="text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate font-medium leading-tight cursor-pointer hover:opacity-85"
              title={gcal.title}
              onClick={e => {
                e.stopPropagation();
                onGoogleEventClick?.(gcal);
              }}
            >
              {gcal.title}
            </div>
          );
        })}
        {overflow > 0 && (
          <span className="text-[10px] sm:text-xs text-text-muted px-1 font-medium">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Month View ───────────────────────────────────────────────────────────────

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  onDayClick,
  googleEvents = [],
  onGoogleEventClick,
}) => {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const tasksByDate = useMemo<Record<string, Task[]>>(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!task.due_date) return;
      let key: string | null = null;
      if (typeof task.due_date === 'string') {
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

  // Build a map of date-key → GoogleCalendarEvent[] for efficient lookup.
  const gcalByDate = useMemo<Record<string, GoogleCalendarEvent[]>>(() => {
    const map: Record<string, GoogleCalendarEvent[]> = {};
    googleEvents.forEach(ev => {
      const key = ev.start.slice(0, 10); // works for both date and datetime formats
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [googleEvents]);

  const grid = useMemo<CalendarDay[]>(() => {
    const today      = new Date();
    const firstDay   = new Date(year, month, 1);
    const startPad   = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells  = Math.ceil((startPad + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const date = new Date(year, month, i - startPad + 1);
      const key  = toDateKey(date);
      return {
        date,
        tasks: tasksByDate[key] ?? [],
        isCurrentMonth: date.getMonth() === month,
        isToday:
          date.getFullYear() === today.getFullYear() &&
          date.getMonth()    === today.getMonth()    &&
          date.getDate()     === today.getDate(),
      };
    });
  }, [year, month, tasksByDate]);

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      {/* Day-of-week header row */}
      <div
        className="grid grid-cols-7 border-b border-border-subtle"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
        {DAY_HEADERS.map(label => (
          <div
            key={label}
            className="py-2 text-center text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wide"
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
            googleEventsForDay={gcalByDate[toDateKey(day.date)] ?? []}
            onClick={onDayClick}
            onGoogleEventClick={onGoogleEventClick}
          />
        ))}
      </div>
    </div>
  );
};

export default MonthView;
