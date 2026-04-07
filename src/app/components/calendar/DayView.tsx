'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Task } from '@/app/types/task';
import { GoogleCalendarEvent } from '@/app/types/calendar';
import { formatTime12Hour } from '@/app/utils/taskUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 72; // px — taller than WeekView for richer task detail
const GOOGLE_BLUE = '#1a73e8';

interface DayViewProps {
  currentDate: Date;
  tasks: Task[];
  onSlotClick: (date: Date, time: string) => void;
  onTaskClick: (task: Task) => void;
  googleEvents?: GoogleCalendarEvent[];
  onGoogleEventClick?: (event: GoogleCalendarEvent) => void;
}

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getPillColor = (task: Task): string => {
  if (task.completed) return 'var(--tm-text-muted)';
  if (task.tags.length > 0) return task.tags[0].color;
  if (task.urgent) return 'var(--tm-warning)';
  return 'var(--tm-accent)';
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getGcalHour = (ev: GoogleCalendarEvent): number | null => {
  if (ev.is_all_day) return null;
  const dt = new Date(ev.start);
  return isNaN(dt.getTime()) ? null : dt.getHours();
};

const getDueTimeHour = (task: Task): number | null => {
  if (!task.due_time) return null;
  const timeStr =
    typeof task.due_time === 'string'
      ? task.due_time
      : task.due_time instanceof Date
      ? task.due_time.toTimeString().slice(0, 5)
      : null;
  if (!timeStr) return null;
  const hour = parseInt(timeStr.split(':')[0], 10);
  return isNaN(hour) ? null : hour;
};

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  tasks,
  onSlotClick,
  onTaskClick,
  googleEvents = [],
  onGoogleEventClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const currentHour = today.getHours();
  const isToday = isSameDay(currentDate, today);

  const dayTasks = useMemo(() => {
    const dateKey = toDateKey(currentDate);
    const allDay: Task[] = [];
    const hourly: Record<number, Task[]> = {};

    tasks.forEach(task => {
      if (!task.due_date) return;
      const taskKey =
        typeof task.due_date === 'string'
          ? task.due_date.slice(0, 10)
          : toDateKey(task.due_date as Date);
      if (taskKey !== dateKey) return;

      const hour = getDueTimeHour(task);
      if (hour === null) {
        allDay.push(task);
      } else {
        if (!hourly[hour]) hourly[hour] = [];
        hourly[hour].push(task);
      }
    });

    return { allDay, hourly };
  }, [currentDate, tasks]);

  const gcalForDay = useMemo(() => {
    const dateKey = toDateKey(currentDate);
    const allDay: GoogleCalendarEvent[] = [];
    const hourly: Record<number, GoogleCalendarEvent[]> = {};
    googleEvents.forEach(ev => {
      if (ev.start.slice(0, 10) !== dateKey) return;
      const hour = getGcalHour(ev);
      if (hour === null) {
        allDay.push(ev);
      } else {
        if (!hourly[hour]) hourly[hour] = [];
        hourly[hour].push(ev);
      }
    });
    return { allDay, hourly };
  }, [currentDate, googleEvents]);

  // Auto-scroll to current hour on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentHour * SLOT_HEIGHT - SLOT_HEIGHT);
    }
  }, []);

  const jumpToNow = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentHour * SLOT_HEIGHT - SLOT_HEIGHT);
    }
  };

  return (
    <div
      className="border border-border-subtle rounded-xl overflow-hidden select-none"
      style={{ backgroundColor: 'var(--tm-surface)' }}
    >
      {/* ── Day header ────────────────────────────────────────────────────── */}
      <div
        className="border-b border-border px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            {DAY_NAMES[currentDate.getDay()]}
          </div>
          <div
            className="text-3xl font-bold leading-tight"
            style={{ color: isToday ? 'var(--tm-accent)' : 'var(--tm-text-primary)' }}
          >
            {currentDate.getDate()}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>

        <button onClick={jumpToNow} className="btn btn-primary px-3 py-1.5 text-xs">
          ↓ Now
        </button>
      </div>

      {/* ── All-day row (rendered when any all-day items exist) ────────────── */}
      {(dayTasks.allDay.length > 0 || gcalForDay.allDay.length > 0) && (
        <div
          className="border-b border-border px-4 py-2 flex items-center gap-2 flex-wrap"
          style={{ backgroundColor: 'var(--tm-surface-raised)' }}
        >
          <span className="text-[10px] text-text-muted mr-1 shrink-0">all-day</span>
          {dayTasks.allDay.map(task => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              style={{ backgroundColor: getPillColor(task) }}
              className="text-white text-xs px-2 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity truncate max-w-[200px]"
              title={task.title}
            >
              {task.title}
            </div>
          ))}
          {gcalForDay.allDay.map(ev => (
            <div
              key={ev.id}
              onClick={() => onGoogleEventClick?.(ev)}
              style={{ backgroundColor: GOOGLE_BLUE }}
              className="text-white text-xs px-2 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity truncate max-w-[200px]"
              title={ev.title}
            >
              {ev.title}
            </div>
          ))}
        </div>
      )}

      {/* ── Scrollable hourly slots ────────────────────────────────────────── */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[520px] sm:max-h-[580px] scrollbar-custom">
        {HOURS.map(hour => {
          const hourTasks = dayTasks.hourly[hour] ?? [];
          const hourGcal  = gcalForDay.hourly[hour]  ?? [];
          const isCurrentHour = isToday && currentHour === hour;
          const timeLabel = formatTime12Hour(`${String(hour).padStart(2, '0')}:00`);

          return (
            <div
              key={hour}
              onClick={() => onSlotClick(currentDate, `${String(hour).padStart(2, '0')}:00`)}
              className="grid grid-cols-[64px_1fr] border-t border-border-subtle cursor-pointer transition-colors"
              style={{
                minHeight: `${SLOT_HEIGHT}px`,
                backgroundColor: isCurrentHour ? 'var(--tm-accent-subtle)' : undefined,
              }}
              onMouseEnter={e => {
                if (!isCurrentHour) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    'var(--tm-surface-raised)';
                }
              }}
              onMouseLeave={e => {
                if (!isCurrentHour) {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = '';
                }
              }}
            >
              {/* Time label */}
              <div className="text-xs text-text-muted flex items-start justify-end pr-3 pt-2 shrink-0 leading-tight">
                {timeLabel}
              </div>

              {/* Task area */}
              <div className="p-1.5 flex flex-col gap-1.5">
                {hourTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={e => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    style={{ backgroundColor: getPillColor(task) }}
                    className="text-white rounded-xl px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold leading-tight truncate">
                          {task.title}
                        </div>
                        {task.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {task.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full leading-tight"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {task.urgent && !task.completed && (
                        <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                          urgent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {hourGcal.map(ev => (
                  <div
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onGoogleEventClick?.(ev); }}
                    style={{ backgroundColor: GOOGLE_BLUE }}
                    className="text-white rounded-xl px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                    title={ev.title}
                  >
                    <div className="text-xs sm:text-sm font-semibold leading-tight truncate">
                      {ev.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
