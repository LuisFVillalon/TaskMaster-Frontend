'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Task, WorkBlock } from '@/app/types/task';
import { GoogleCalendarEvent } from '@/app/types/calendar';
import { formatTime12Hour } from '@/app/utils/taskUtils';

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_HEIGHT = 60; // px per hour row
const GOOGLE_BLUE = '#1a73e8';
const WORK_BLOCK_SUGGESTED = '#7c3aed';  // violet — dashed border
const WORK_BLOCK_CONFIRMED  = '#059669';  // emerald — solid border

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  onSlotClick: (date: Date, time: string) => void;
  onTaskClick: (task: Task) => void;
  googleEvents?: GoogleCalendarEvent[];
  onGoogleEventClick?: (event: GoogleCalendarEvent) => void;
  workBlocks?: WorkBlock[];
  onWorkBlockAction?: (id: number, status: 'confirmed' | 'dismissed') => void;
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

/** Extract the hour (0-23) from a Google Calendar event start, or null for all-day. */
const getGcalHour = (ev: GoogleCalendarEvent): number | null => {
  if (ev.is_all_day) return null;
  const dt = new Date(ev.start);
  return isNaN(dt.getTime()) ? null : dt.getHours();
};

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  tasks,
  onSlotClick,
  onTaskClick,
  googleEvents = [],
  onGoogleEventClick,
  workBlocks = [],
  onWorkBlockAction,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const currentHour = today.getHours();

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

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

  // Build Google event lookup: dateKey → { allDay, hourly }
  const gcalByDate = useMemo(() => {
    const map: Record<string, { allDay: GoogleCalendarEvent[]; hourly: Record<number, GoogleCalendarEvent[]> }> = {};
    googleEvents.forEach(ev => {
      const key = ev.start.slice(0, 10);
      if (!map[key]) map[key] = { allDay: [], hourly: {} };
      const hour = getGcalHour(ev);
      if (hour === null) {
        map[key].allDay.push(ev);
      } else {
        if (!map[key].hourly[hour]) map[key].hourly[hour] = [];
        map[key].hourly[hour].push(ev);
      }
    });
    return map;
  }, [googleEvents]);

  // Build work block lookup: dateKey → hourly buckets
  const workBlocksByDate = useMemo(() => {
    const map: Record<string, Record<number, WorkBlock[]>> = {};
    workBlocks.forEach(wb => {
      const key = wb.start_time.slice(0, 10);
      const hour = new Date(wb.start_time).getHours();
      if (!map[key]) map[key] = {};
      if (!map[key][hour]) map[key][hour] = [];
      map[key][hour].push(wb);
    });
    return map;
  }, [workBlocks]);

  // Task title lookup for work block pills
  const taskMap = useMemo(() => {
    const m: Record<number, string> = {};
    tasks.forEach(t => { m[t.id] = t.title; });
    return m;
  }, [tasks]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentHour * SLOT_HEIGHT - SLOT_HEIGHT);
    }
  }, [currentHour]);

  return (
    <div
      className="border border-border-subtle rounded-xl overflow-hidden select-none"
      style={{ backgroundColor: 'var(--tm-surface)' }}
    >
      {/* ── Day header row ─────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border-subtle"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
        <div />
        {weekDays.map(day => {
          const isToday = isSameDay(day, today);
          return (
            <div key={toDateKey(day)} className="py-2 text-center border-l border-border-subtle">
              <div className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wide">
                {DAY_ABBRS[day.getDay()]}
              </div>
              {isToday ? (
                <span
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mx-auto mt-0.5"
                  style={{ backgroundColor: 'var(--tm-accent)', color: 'var(--tm-accent-text)' }}
                >
                  {day.getDate()}
                </span>
              ) : (
                <div className="text-xs sm:text-sm font-medium text-text-primary mt-0.5">
                  {day.getDate()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── All-day row ────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
        <div className="text-[10px] text-text-muted flex items-center justify-center leading-tight px-0.5 text-center py-1">
          all<br />day
        </div>
        {weekDays.map(day => {
          const key          = toDateKey(day);
          const allDayTasks  = tasksByDate[key]?.allDay  ?? [];
          const allDayGcal   = gcalByDate[key]?.allDay   ?? [];
          return (
            <div key={key} className="border-l border-border-subtle p-1 min-h-[32px]">
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
              {allDayGcal.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => onGoogleEventClick?.(ev)}
                  style={{ backgroundColor: GOOGLE_BLUE }}
                  className="text-white text-[10px] px-1 py-0.5 rounded truncate font-medium mb-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  title={ev.title}
                >
                  {ev.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Scrollable hourly grid ─────────────────────────────────────────── */}
      <div ref={scrollRef} className="overflow-y-auto max-h-[520px] sm:max-h-[580px] scrollbar-custom">
        {HOURS.map(hour => {
          const timeLabel    = formatTime12Hour(`${String(hour).padStart(2, '0')}:00`);
          const isCurrentHour = currentHour === hour;

          return (
            <div
              key={hour}
              className="grid grid-cols-[48px_repeat(7,1fr)] border-t border-border-subtle"
              style={{
                minHeight: `${SLOT_HEIGHT}px`,
                backgroundColor: isCurrentHour ? 'var(--tm-accent-subtle)' : undefined,
              }}
            >
              {/* Time label */}
              <div className="text-[10px] text-text-muted flex items-start justify-end pr-2 pt-1 shrink-0 leading-tight">
                {timeLabel}
              </div>

              {/* One slot per day column */}
              {weekDays.map(day => {
                const key        = toDateKey(day);
                const hourTasks  = tasksByDate[key]?.hourly[hour]      ?? [];
                const hourGcal   = gcalByDate[key]?.hourly[hour]       ?? [];
                const hourBlocks = workBlocksByDate[key]?.[hour]       ?? [];
                const isTodayCol = isSameDay(day, today);

                return (
                  <div
                    key={key}
                    onClick={() => onSlotClick(day, `${String(hour).padStart(2, '0')}:00`)}
                    className="border-l border-border-subtle p-0.5 cursor-pointer transition-colors overflow-hidden relative"
                    style={{
                      minHeight: `${SLOT_HEIGHT}px`,
                      maxHeight: `${SLOT_HEIGHT}px`,
                      backgroundColor: isTodayCol
                        ? isCurrentHour
                          ? 'color-mix(in srgb, var(--tm-accent) 18%, transparent)'
                          : 'color-mix(in srgb, var(--tm-accent) 6%, transparent)'
                        : undefined,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor =
                        'color-mix(in srgb, var(--tm-accent) 10%, transparent)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = isTodayCol
                        ? isCurrentHour
                          ? 'color-mix(in srgb, var(--tm-accent) 18%, transparent)'
                          : 'color-mix(in srgb, var(--tm-accent) 6%, transparent)'
                        : '';
                    }}
                  >
                    <div className="flex flex-col w-full overflow-hidden">
                      {hourTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={e => { e.stopPropagation(); onTaskClick(task); }}
                          style={{ backgroundColor: getPillColor(task) }}
                          className="text-white text-[10px] px-1 py-0.5 rounded truncate font-medium mb-0.5 cursor-pointer hover:opacity-80 transition-opacity block w-full"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {hourGcal.map(ev => (
                        <div
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); onGoogleEventClick?.(ev); }}
                          style={{ backgroundColor: GOOGLE_BLUE }}
                          className="text-white text-[10px] px-1 py-0.5 rounded truncate font-medium mb-0.5 cursor-pointer hover:opacity-80 transition-opacity block w-full"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {hourBlocks.map(wb => {
                        const color = wb.status === 'confirmed' ? WORK_BLOCK_CONFIRMED : WORK_BLOCK_SUGGESTED;
                        const title = taskMap[wb.task_id] ?? 'AI Work Block';
                        return (
                          <div
                            key={wb.id}
                            onClick={e => e.stopPropagation()}
                            style={{
                              borderColor: color,
                              color,
                              border: `2px ${wb.status === 'confirmed' ? 'solid' : 'dashed'} ${color}`,
                            }}
                            className="text-[10px] px-1 py-0.5 rounded mb-0.5 w-full"
                            title={`${title} — ${wb.ai_reasoning}`}
                          >
                            <div className="flex items-center justify-between gap-0.5">
                              <span className="truncate flex-1">{title}</span>
                              {wb.status === 'suggested' && onWorkBlockAction && (
                                <span className="flex gap-0.5 shrink-0">
                                  <button
                                    onClick={e => { e.stopPropagation(); onWorkBlockAction(wb.id, 'confirmed'); }}
                                    title="Confirm"
                                    className="hover:opacity-70 font-bold leading-none"
                                  >✓</button>
                                  <button
                                    onClick={e => { e.stopPropagation(); onWorkBlockAction(wb.id, 'dismissed'); }}
                                    title="Dismiss"
                                    className="hover:opacity-70 font-bold leading-none"
                                  >✕</button>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
