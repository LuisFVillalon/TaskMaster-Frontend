'use client';

import React, { useState, useEffect, useMemo } from 'react';

type SemesterType = 'Spring' | 'Summer' | 'Fall' | 'Winter';

interface SemesterInfo {
  type: SemesterType;
  year: number;
  startDate: Date;
  endDate: Date;
  weekCount: number;
}

const academicCalendar: SemesterInfo[] = [
  {
    type: 'Spring',
    year: 2026,
    startDate: new Date('2026-01-20'),
    endDate: new Date('2026-05-13'),
    weekCount: 16,
  },
];

interface CalendarResult {
  currentSemester: SemesterInfo | null;
  weekNumber: number | null;
  daysIntoSemester: number | null;
  daysRemaining: number | null;
  isInSession: boolean;
  nextSemester: SemesterInfo | null;
}

const SDSUAcademicCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const calculateCalendarInfo = (date: Date): CalendarResult => {
    const currentSemester =
      academicCalendar.find(
        (semester) =>
          date >= semester.startDate && date <= semester.endDate
      ) ?? null;

    let weekNumber: number | null = null;
    let daysIntoSemester: number | null = null;
    let daysRemaining: number | null = null;

    if (currentSemester) {
      const timeDiff =
        date.getTime() - currentSemester.startDate.getTime();

      daysIntoSemester = Math.floor(
        timeDiff / (1000 * 60 * 60 * 24)
      );

      weekNumber = Math.floor(daysIntoSemester / 7) + 1;

      if (weekNumber > currentSemester.weekCount) {
        weekNumber = currentSemester.weekCount;
      }

      const timeRemaining =
        currentSemester.endDate.getTime() - date.getTime();

      daysRemaining = Math.ceil(
        timeRemaining / (1000 * 60 * 60 * 24)
      );
    }

    const nextSemester =
      academicCalendar.find(
        (semester) => semester.startDate > date
      ) ?? null;

    return {
      currentSemester,
      weekNumber,
      daysIntoSemester,
      daysRemaining,
      isInSession: currentSemester !== null,
      nextSemester,
    };
  };

  // ✅ Derived state (no useEffect needed)
  const calendarInfo = useMemo(() => {
    return calculateCalendarInfo(currentDate);
  }, [currentDate]);

  // ✅ Midnight updater effect (runs once)
  useEffect(() => {
    const updateDate = () => setCurrentDate(new Date());

    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const timeUntilMidnight =
      tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      updateDate();
      const interval = setInterval(
        updateDate,
        24 * 60 * 60 * 1000
      );

      return () => clearInterval(interval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const getSemesterColor = (type: SemesterType): string => {
    switch (type) {
      case 'Spring':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Summer':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Fall':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Winter':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full p-6 bg-white rounded-2xl shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-600 mb-2">
          SDSU Academic Calendar
        </h1>
        <p className="text-gray-600">
          San Diego State University
        </p>
      </div>

      {/* Current Date Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Current Date</p>
        <p className="text-xl font-semibold text-gray-800">
          {formatDate(currentDate)}
        </p>
      </div>

      {/* Current Semester Info */}
      {calendarInfo.isInSession &&
      calendarInfo.currentSemester ? (
        <div className="mb-6">
          <div
            className={`p-6 rounded-lg border-2 ${getSemesterColor(
              calendarInfo.currentSemester.type
            )}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {calendarInfo.currentSemester.type}{' '}
                  {calendarInfo.currentSemester.year}
                </h2>
                <p className="text-sm mt-1">
                  {formatDate(
                    calendarInfo.currentSemester.startDate
                  )}{' '}
                  -{' '}
                  {formatDate(
                    calendarInfo.currentSemester.endDate
                  )}
                </p>
              </div>

              <div className="text-right">
                <div className="text-4xl font-bold">
                  Week {calendarInfo.weekNumber}
                </div>
                <div className="text-sm">
                  of{' '}
                  {
                    calendarInfo.currentSemester.weekCount
                  }
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white bg-opacity-50 p-3 rounded">
                <p className="text-sm font-medium">
                  Days into Semester
                </p>
                <p className="text-2xl font-bold">
                  {calendarInfo.daysIntoSemester}
                </p>
              </div>

              <div className="bg-white bg-opacity-50 p-3 rounded">
                <p className="text-sm font-medium">
                  Days Remaining
                </p>
                <p className="text-2xl font-bold">
                  {calendarInfo.daysRemaining}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
                <div
                  className="bg-current h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((calendarInfo.daysIntoSemester || 0) /
                        ((calendarInfo.daysIntoSemester || 0) +
                          (calendarInfo.daysRemaining || 0))) *
                      100
                    }%`,
                  }}
                />
              </div>

              <p className="text-xs text-center mt-1">
                {Math.round(
                  ((calendarInfo.daysIntoSemester || 0) /
                    ((calendarInfo.daysIntoSemester || 0) +
                      (calendarInfo.daysRemaining || 0))) *
                    100
                )}
                % Complete
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-gray-100 rounded-lg border-2 border-gray-300">
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Not Currently in Session
          </h2>
          <p className="text-gray-600">
            You are currently between semesters.
          </p>
        </div>
      )}
    </div>
  );
};

export default SDSUAcademicCalendar;




