'use client';

import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Task, WorkBlock } from '@/app/types/task';
import { GoogleCalendarEvent } from '@/app/types/calendar';
import { useCalendarState } from '@/app/hooks/useCalendarState';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const MONTH_ABBRS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

interface CalendarViewProps {
  tasks: Task[];
  onDayClick: (date: Date) => void;
  onSlotClick: (date: Date, time: string) => void;
  onTaskClick: (task: Task) => void;
  /** Google Calendar events to overlay (Google Blue pills). */
  googleEvents?: GoogleCalendarEvent[];
  /** Called when a Google Calendar event pill is clicked. */
  onGoogleEventClick?: (event: GoogleCalendarEvent) => void;
  /** True while a Google Calendar sync is in-flight. */
  googleSyncing?: boolean;
  /**
   * Called whenever the visible date range changes (view or navigation) and
   * when the user clicks the Sync button.  Receives the ISO 8601 time range
   * so the parent can fetch Google Calendar events for that window.
   * Only called when Google Calendar is connected (non-null handler).
   */
  onSync?: (timeMin: string, timeMax: string) => void;
  /** AI-scheduled work blocks to overlay on the calendar. */
  workBlocks?: WorkBlock[];
  /** Called when the user accepts or dismisses a suggested work block. */
  onWorkBlockAction?: (id: number, status: 'confirmed' | 'dismissed') => void;
  /** Called when the user drag-and-drops a confirmed work block to a new time. */
  onWorkBlockReschedule?: (id: number, startTime: string, endTime: string) => void;
}

// Compute the ISO 8601 time range that should be fetched for the current view.
function getTimeRange(view: 'month' | 'week' | 'day', date: Date): { timeMin: string; timeMax: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  let startD: Date, endD: Date;

  if (view === 'month') {
    // Cover the entire grid: ~7 days before the 1st and ~7 days after the last.
    startD = new Date(y, m, 1);
    startD.setDate(startD.getDate() - 7);
    endD = new Date(y, m + 1, 0);
    endD.setDate(endD.getDate() + 7);
  } else if (view === 'week') {
    startD = new Date(y, m, d - new Date(y, m, d).getDay()); // Sunday
    endD   = new Date(startD);
    endD.setDate(startD.getDate() + 6);
  } else {
    startD = new Date(y, m, d);
    endD   = new Date(y, m, d);
  }

  startD.setHours(0, 0, 0, 0);
  endD.setHours(23, 59, 59, 999);
  return { timeMin: startD.toISOString(), timeMax: endD.toISOString() };
}

const weekRangeLabel = (date: Date): string => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const yearSuffix = `, ${end.getFullYear()}`;
  if (start.getMonth() === end.getMonth()) {
    return `${MONTH_ABBRS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}${yearSuffix}`;
  }
  return `${MONTH_ABBRS[start.getMonth()]} ${start.getDate()} – ${MONTH_ABBRS[end.getMonth()]} ${end.getDate()}${yearSuffix}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onDayClick,
  onSlotClick,
  onTaskClick,
  googleEvents = [],
  onGoogleEventClick,
  googleSyncing = false,
  onSync,
  workBlocks = [],
  onWorkBlockAction,
  onWorkBlockReschedule,
}) => {
  const { view, setView, currentDate, goToPrev, goToNext, goToToday } = useCalendarState();

  const triggerSync = useCallback(() => {
    if (!onSync) return;
    const { timeMin, timeMax } = getTimeRange(view, currentDate);
    onSync(timeMin, timeMax);
  }, [onSync, view, currentDate]);

  // Auto-sync whenever the visible date range changes.
  useEffect(() => {
    triggerSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentDate.toDateString()]);

  const headerLabel =
    view === 'month'
      ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : view === 'week'
      ? weekRangeLabel(currentDate)
      : `${DAY_NAMES[currentDate.getDay()]}, ${MONTH_ABBRS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

  const prevAriaLabel = view === 'month' ? 'Previous month' : view === 'week' ? 'Previous week' : 'Previous day';
  const nextAriaLabel = view === 'month' ? 'Next month' : view === 'week' ? 'Next week' : 'Next day';

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header: navigation + sync + view toggles ────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button onClick={goToPrev} aria-label={prevAriaLabel} className="btn btn-ghost p-1.5">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-base sm:text-lg font-semibold text-text-primary min-w-[160px] sm:min-w-[220px] text-center">
            {headerLabel}
          </span>

          <button onClick={goToNext} aria-label={nextAriaLabel} className="btn btn-ghost p-1.5">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="btn btn-secondary px-3 py-1.5 text-sm">
            Today
          </button>

          {/* Google Calendar sync button — only shown when onSync is wired */}
          {onSync && (
            <button
              onClick={triggerSync}
              disabled={googleSyncing}
              aria-label="Sync Google Calendar"
              title="Sync Google Calendar"
              className="btn btn-ghost p-1.5 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${googleSyncing ? 'animate-spin' : ''}`}
                style={{ color: '#1a73e8' }}
              />
            </button>
          )}

          {/* View toggle */}
          <div
            className="flex rounded-xl overflow-hidden border border-border text-sm font-medium"
            style={{ backgroundColor: 'var(--tm-surface-raised)' }}
          >
            {(['month', 'week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 transition-all capitalize"
                style={view === v ? {
                  backgroundColor: 'var(--tm-accent)',
                  color: 'var(--tm-accent-text)',
                } : {
                  color: 'var(--tm-text-secondary)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar body ───────────────────────────────────────────────────── */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          tasks={tasks}
          onDayClick={onDayClick}
          googleEvents={googleEvents}
          onGoogleEventClick={onGoogleEventClick}
        />
      )}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          onSlotClick={onSlotClick}
          onTaskClick={onTaskClick}
          googleEvents={googleEvents}
          onGoogleEventClick={onGoogleEventClick}
          workBlocks={workBlocks}
          onWorkBlockAction={onWorkBlockAction}
          onWorkBlockReschedule={onWorkBlockReschedule}
        />
      )}
      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          tasks={tasks}
          onSlotClick={onSlotClick}
          onTaskClick={onTaskClick}
          googleEvents={googleEvents}
          onGoogleEventClick={onGoogleEventClick}
          workBlocks={workBlocks}
          onWorkBlockAction={onWorkBlockAction}
          onWorkBlockReschedule={onWorkBlockReschedule}
        />
      )}
    </div>
  );
};

export default CalendarView;
