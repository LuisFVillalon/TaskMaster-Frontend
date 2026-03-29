'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/app/types/task';
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
}

// Compute the Sun–Sat label for the week containing `date`.
const weekRangeLabel = (date: Date): string => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // rewind to Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const yearSuffix = `, ${end.getFullYear()}`;
  if (start.getMonth() === end.getMonth()) {
    return `${MONTH_ABBRS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}${yearSuffix}`;
  }
  // Cross-month week (e.g. Jan 26 – Feb 1, 2026)
  return `${MONTH_ABBRS[start.getMonth()]} ${start.getDate()} – ${MONTH_ABBRS[end.getMonth()]} ${end.getDate()}${yearSuffix}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onDayClick,
  onSlotClick,
  onTaskClick,
}) => {
  const { view, setView, currentDate, goToPrev, goToNext, goToToday } = useCalendarState();

  // View-aware header label.
  const headerLabel =
    view === 'month'
      ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : view === 'week'
      ? weekRangeLabel(currentDate)
      : `${DAY_NAMES[currentDate.getDay()]}, ${MONTH_ABBRS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

  const prevAriaLabel =
    view === 'month' ? 'Previous month' : view === 'week' ? 'Previous week' : 'Previous day';
  const nextAriaLabel =
    view === 'month' ? 'Next month' : view === 'week' ? 'Next week' : 'Next day';

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header: navigation + view toggles ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            aria-label={prevAriaLabel}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Label width is generous for the longest day-view string, e.g. "Wednesday, Nov 28, 2026" */}
          <span className="text-base sm:text-lg font-semibold text-gray-900 min-w-[160px] sm:min-w-[220px] text-center">
            {headerLabel}
          </span>

          <button
            onClick={goToNext}
            aria-label={nextAriaLabel}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Today */}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Today
          </button>

          {/* View toggle — all three now active */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm font-medium">
            {(['month', 'week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 transition-colors capitalize ${
                  view === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
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
        />
      )}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          onSlotClick={onSlotClick}
          onTaskClick={onTaskClick}
        />
      )}
      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          tasks={tasks}
          onSlotClick={onSlotClick}
          onTaskClick={onTaskClick}
        />
      )}
    </div>
  );
};

export default CalendarView;
