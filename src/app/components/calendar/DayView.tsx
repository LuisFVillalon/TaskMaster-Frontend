'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Task } from '@/app/types/task';
import { formatTime12Hour } from '@/app/utils/taskUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0–23
const SLOT_HEIGHT = 72; // px — taller than WeekView for richer task detail

interface DayViewProps {
  currentDate: Date;
  tasks: Task[];
  onSlotClick: (date: Date, time: string) => void;
  onTaskClick: (task: Task) => void;
}

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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

// ─── DayView ──────────────────────────────────────────────────────────────────

const DayView: React.FC<DayViewProps> = ({ currentDate, tasks, onSlotClick, onTaskClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const currentHour = today.getHours();
  const isToday = isSameDay(currentDate, today);

  // Group this day's tasks into allDay and hourly buckets.
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

  // Auto-scroll to one slot above the current hour on mount.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentHour * SLOT_HEIGHT - SLOT_HEIGHT);
    }
  // Intentionally run once on mount — same rationale as WeekView.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jumpToNow = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentHour * SLOT_HEIGHT - SLOT_HEIGHT);
    }
  };

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden select-none">

      {/* ── Day header ────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {DAY_NAMES[currentDate.getDay()]}
          </div>
          <div className={`text-3xl font-bold leading-tight ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {currentDate.getDate()}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>

        {/* Jump-to-now — always shown so it works as a scroll shortcut on any day */}
        <button
          onClick={jumpToNow}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          ↓ Now
        </button>
      </div>

      {/* ── All-day row (only rendered when tasks exist) ───────────────────── */}
      {dayTasks.allDay.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-400 mr-1 shrink-0">all-day</span>
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
        </div>
      )}

      {/* ── Scrollable hourly slots ────────────────────────────────────────── */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[520px] sm:max-h-[580px]">
        {HOURS.map(hour => {
          const hourTasks = dayTasks.hourly[hour] ?? [];
          const isCurrentHour = isToday && currentHour === hour;
          const timeLabel = formatTime12Hour(`${String(hour).padStart(2, '0')}:00`);

          return (
            <div
              key={hour}
              onClick={() =>
                onSlotClick(currentDate, `${String(hour).padStart(2, '0')}:00`)
              }
              className={`grid grid-cols-[64px_1fr] border-t border-gray-100 cursor-pointer transition-colors ${
                isCurrentHour ? 'bg-blue-50 hover:bg-blue-100/60' : 'hover:bg-gray-50'
              }`}
              style={{ minHeight: `${SLOT_HEIGHT}px` }}
            >
              {/* Time label */}
              <div className="text-xs text-gray-400 flex items-start justify-end pr-3 pt-2 shrink-0 leading-tight">
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
                    className="text-white rounded-lg px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="text-xs sm:text-sm font-semibold leading-tight truncate">
                          {task.title}
                        </div>

                        {/* Tags */}
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

                      {/* Urgency badge */}
                      {task.urgent && !task.completed && (
                        <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                          urgent
                        </span>
                      )}
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
