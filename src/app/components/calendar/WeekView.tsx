'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Task } from '@/app/types/task';
import { formatTime12Hour } from '@/app/utils/taskUtils';

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0–23
const SLOT_HEIGHT = 60; // px per hour row

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  onSlotClick: (date: Date, time: string) => void;
  onTaskClick: (task: Task) => void;
}

// Shared with MonthView — local YYYY-MM-DD key in local timezone.
const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Color priority matches MonthView: completed → gray, first tag, urgent → orange, default → blue.
const getPillColor = (task: Task): string => {
  if (task.completed) return '#9CA3AF';
  if (task.tags.length > 0) return task.tags[0].color;
  if (task.urgent) return '#F97316';
  return '#3B82F6';
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Normalize due_time (string | Date | null) → hour number or null.
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

// ─── WeekView ─────────────────────────────────────────────────────────────────

const WeekView: React.FC<WeekViewProps> = ({ currentDate, tasks, onSlotClick, onTaskClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const currentHour = today.getHours();

  // 7 dates for the week (Sun–Sat) that contains currentDate.
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // rewind to Sunday
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Group tasks by YYYY-MM-DD key into allDay or an hourly bucket.
  const tasksByDate = useMemo(() => {
    const map: Record<string, { allDay: Task[]; hourly: Record<number, Task[]> }> = {};

    tasks.forEach(task => {
      if (!task.due_date) return;
      const key =
        typeof task.due_date === 'string'
          ? task.due_date.slice(0, 10)
          : toDateKey(task.due_date as Date);

      if (!map[key]) map[key] = { allDay: [], hourly: {} };

      const hour = getDueTimeHour(task);
      if (hour === null) {
        map[key].allDay.push(task);
      } else {
        if (!map[key].hourly[hour]) map[key].hourly[hour] = [];
        map[key].hourly[hour].push(task);
      }
    });

    return map;
  }, [tasks]);

  // Auto-scroll to one slot above the current hour on mount.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentHour * SLOT_HEIGHT - SLOT_HEIGHT);
    }
  // Intentionally run once on mount — scrolling to current hour is an initial orientation,
  // not a reactive update. Re-running on hour change would fight the user's manual scroll.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden select-none">

      {/* ── Day header row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] bg-gray-50 border-b border-gray-100">
        <div /> {/* spacer above time-label column */}
        {weekDays.map(day => {
          const isToday = isSameDay(day, today);
          return (
            <div key={toDateKey(day)} className="py-2 text-center border-l border-gray-100">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {DAY_ABBRS[day.getDay()]}
              </div>
              {isToday ? (
                <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mx-auto mt-0.5">
                  {day.getDate()}
                </span>
              ) : (
                <div className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">
                  {day.getDate()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── All-day row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
        <div className="text-[10px] text-gray-400 flex items-center justify-center leading-tight px-0.5 text-center py-1">
          all<br />day
        </div>
        {weekDays.map(day => {
          const key = toDateKey(day);
          const allDayTasks = tasksByDate[key]?.allDay ?? [];
          return (
            <div key={key} className="border-l border-gray-100 p-1 min-h-[32px]">
              {allDayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  style={{ backgroundColor: getPillColor(task) }}
                  className="text-white text-[10px] px-1 py-0.5 rounded truncate font-medium mb-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Scrollable hourly grid ─────────────────────────────────────────── */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[520px] sm:max-h-[580px]">
        {HOURS.map(hour => {
          const timeLabel = formatTime12Hour(`${String(hour).padStart(2, '0')}:00`);
          // Highlight current hour row as a global time orientation cue (regardless of week shown).
          const isCurrentHour = currentHour === hour;

          return (
            <div
              key={hour}
              className={`grid grid-cols-[48px_repeat(7,1fr)] border-t border-gray-100 ${
                isCurrentHour ? 'bg-blue-50' : ''
              }`}
              style={{ minHeight: `${SLOT_HEIGHT}px` }}
            >
              {/* Time label */}
              <div className="text-[10px] text-gray-400 flex items-start justify-end pr-2 pt-1 shrink-0 leading-tight">
                {timeLabel}
              </div>

              {/* One slot per day column */}
              {weekDays.map(day => {
                const key = toDateKey(day);
                const hourTasks = tasksByDate[key]?.hourly[hour] ?? [];
                const isTodayCol = isSameDay(day, today);

                return (
                  <div
                    key={key}
                    onClick={() =>
                      onSlotClick(day, `${String(hour).padStart(2, '0')}:00`)
                    }
                    className={`border-l border-gray-100 p-0.5 cursor-pointer transition-colors ${
                      isTodayCol
                        ? isCurrentHour
                          ? 'bg-blue-100/60 hover:bg-blue-100'
                          : 'bg-blue-50/30 hover:bg-blue-50/70'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ minHeight: `${SLOT_HEIGHT}px` }}
                  >
                    {hourTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={e => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        style={{ backgroundColor: getPillColor(task) }}
                        className="text-white text-[10px] px-1 py-0.5 rounded truncate font-medium mb-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
