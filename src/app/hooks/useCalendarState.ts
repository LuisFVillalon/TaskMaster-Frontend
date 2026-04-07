import { useState } from 'react';
import { CalendarView } from '@/app/types/calendar';

export const useCalendarState = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Navigation steps are view-aware:
  //   month → move by 1 month (normalised to the 1st)
  //   week  → move by 7 days
  //   day   → move by 1 day
  const goToPrev = () => {
    setCurrentDate(prev => {
      if (view === 'week') return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
      if (view === 'day')  return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1);
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      if (view === 'week') return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
      if (view === 'day')  return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  };

  // goToToday always snaps to today's real Date regardless of view.
  const goToToday = () => setCurrentDate(new Date());

  return { view, setView, currentDate, goToPrev, goToNext, goToToday };
};
