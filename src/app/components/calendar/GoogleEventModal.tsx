'use client';

import React from 'react';
import { X, ExternalLink, MapPin, AlignLeft, Calendar } from 'lucide-react';
import { GoogleCalendarEvent } from '@/app/types/calendar';

interface GoogleEventModalProps {
  event: GoogleCalendarEvent | null;
  onClose: () => void;
}

const GOOGLE_BLUE = '#1a73e8';

function formatDateTimeRange(event: GoogleCalendarEvent): string {
  if (event.is_all_day) {
    // all-day dates are "YYYY-MM-DD" — parse without timezone conversion
    const [y, m, d] = event.start.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  }
  const start = new Date(event.start);
  const end   = new Date(event.end);
  const sameDay = start.toDateString() === end.toDateString();
  const datePart  = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime   = end.toLocaleTimeString(undefined,   { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `${datePart} · ${startTime} – ${endTime}`;
  const startShort = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endShort   = end.toLocaleDateString(undefined,   { month: 'short', day: 'numeric' });
  return `${startShort} ${startTime} – ${endShort} ${endTime}`;
}

export default function GoogleEventModal({ event, onClose }: GoogleEventModalProps) {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--tm-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Coloured header bar ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: GOOGLE_BLUE }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/80" />
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
              Google Calendar
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Event body ────────────────────────────────────────────────────── */}
        <div className="px-5 py-5 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary leading-tight">
            {event.title}
          </h2>

          {/* Date / time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOOGLE_BLUE }} />
            <p className="text-sm text-text-primary">{formatDateTimeRange(event)}</p>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOOGLE_BLUE }} />
              <p className="text-sm text-text-primary">{event.location}</p>
            </div>
          )}

          {/* Description (strip any HTML tags from Google's rich text) */}
          {event.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOOGLE_BLUE }} />
              <p className="text-sm text-text-muted whitespace-pre-wrap line-clamp-6">
                {event.description.replace(/<[^>]+>/g, '')}
              </p>
            </div>
          )}

          {/* Read-only notice */}
          <p className="text-xs italic" style={{ color: 'var(--tm-text-muted)' }}>
            This event is read-only. Edit or delete it in Google Calendar.
          </p>

          {/* CTA: open in Google Calendar */}
          <a
            href={event.html_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: GOOGLE_BLUE }}
          >
            <ExternalLink className="w-4 h-4" />
            View in Google Calendar
          </a>
        </div>
      </div>
    </div>
  );
}
