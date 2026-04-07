'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Pencil, AlertCircle } from 'lucide-react';
import { CalendarSettings } from '@/app/types/calendar';
import {
  fetchCalendarSettings,
  updateCalendarSettings,
} from '@/app/lib/backend-api';

// ── Defaults used as fallback while settings are loading ──────────────────────
const DEFAULTS: Omit<CalendarSettings, 'id'> = {
  title: 'Big Picture Calendar',
  sub_header: 'First Quarter',
  start_date: '2026-01-01',
  end_date: '2026-03-31',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// ── Component ─────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const BigPictureCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'sub_header' | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subHeaderInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch settings on mount ────────────────────────────────────────────────
  // fetchCalendarSettings returns null for new users (HTTP 404 → no DB row yet).
  // In that case we leave `settings` as null so the component renders DEFAULTS
  // locally without writing anything to the database. The first time the user
  // edits a field, scheduleAutoSave fires and the PATCH endpoint creates the row.
  useEffect(() => {
    fetchCalendarSettings()
      .then(data => { if (data !== null) setSettings(data); })
      .catch(() => { /* network / auth error — keep showing DEFAULTS */ });
  }, []);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingField === 'title') titleInputRef.current?.select();
    if (editingField === 'sub_header') subHeaderInputRef.current?.select();
  }, [editingField]);

  // ── Midnight date updater ──────────────────────────────────────────────────
  useEffect(() => {
    const updateDate = () => setCurrentDate(new Date());
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      updateDate();
      const interval = setInterval(updateDate, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilMidnight);
    return () => clearTimeout(timeout);
  }, []);

  // ── Auto-save with 800 ms debounce ────────────────────────────────────────
  const scheduleAutoSave = (updated: CalendarSettings) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const saved = await updateCalendarSettings({
          title: updated.title,
          sub_header: updated.sub_header,
          start_date: updated.start_date,
          end_date: updated.end_date,
        });
        setSettings(saved);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 800);
  };

  const updateField = <K extends keyof CalendarSettings>(key: K, value: CalendarSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    scheduleAutoSave(updated);
  };

  // ── Computed progress ─────────────────────────────────────────────────────
  const progress = useMemo(() => {
    if (!settings) return null;
    const start = parseLocalDate(settings.start_date);
    const end = parseLocalDate(settings.end_date);
    const today = currentDate;

    if (today < start || today > end) return null;

    const msDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.round((end.getTime() - start.getTime()) / msDay);
    const daysInto = Math.floor((today.getTime() - start.getTime()) / msDay);
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / msDay);
    const weekNumber = Math.min(Math.floor(daysInto / 7) + 1, Math.ceil(totalDays / 7));
    const totalWeeks = Math.ceil(totalDays / 7);
    const pct = Math.round((daysInto / totalDays) * 100);

    return { totalDays, daysInto, daysRemaining, weekNumber, totalWeeks, pct, start, end };
  }, [settings, currentDate]);

  // ── Render ────────────────────────────────────────────────────────────────
  const cur = settings ?? { id: 0, ...DEFAULTS };

  const saveIndicator = (
    <span className="text-xs font-medium ml-2" style={{
      color: saveStatus === 'saved' ? 'var(--tm-success, #22c55e)'
           : saveStatus === 'error' ? 'var(--tm-danger)'
           : 'var(--tm-text-muted)',
    }}>
      {saveStatus === 'saving' && 'Saving…'}
      {saveStatus === 'saved' && '✓ Saved'}
      {saveStatus === 'error' && '⚠ Save failed'}
    </span>
  );

  return (
    <div className="card w-full max-w-4xl mx-auto h-full p-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          {editingField === 'title' ? (
            <input
              ref={titleInputRef}
              value={cur.title}
              onChange={e => updateField('title', e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
              className="text-3xl font-bold bg-transparent border-b-2 outline-none w-full"
              style={{ color: '#DC2626', borderColor: '#DC2626' }}
            />
          ) : (
            <button
              onClick={() => setEditingField('title')}
              className="group flex items-center gap-2 text-left"
              title="Click to edit"
            >
              <h1 className="text-3xl font-bold" style={{ color: '#DC2626' }}>
                {cur.title}
              </h1>
              <Pencil
                className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0"
                style={{ color: '#DC2626' }}
              />
            </button>
          )}
          {saveIndicator}
        </div>

        {editingField === 'sub_header' ? (
          <input
            ref={subHeaderInputRef}
            value={cur.sub_header}
            onChange={e => updateField('sub_header', e.target.value)}
            onBlur={() => setEditingField(null)}
            onKeyDown={e => e.key === 'Enter' && setEditingField(null)}
            className="text-sm bg-transparent border-b outline-none w-full"
            style={{ color: 'var(--tm-text-secondary)', borderColor: 'var(--tm-border-subtle)' }}
          />
        ) : (
          <button
            onClick={() => setEditingField('sub_header')}
            className="group flex items-center gap-1 text-left"
            title="Click to edit"
          >
            <p className="text-sm text-text-secondary">{cur.sub_header}</p>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity text-text-muted" />
          </button>
        )}
      </div>

      {/* ── Current Date ───────────────────────────────────────────────── */}
      <div
        className="mb-5 p-4 rounded-xl border border-border-subtle"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
        <p className="text-sm text-text-muted">Current Date</p>
        <p className="text-xl font-semibold text-text-primary">{formatDate(currentDate)}</p>
      </div>

      {/* ── Date Range Inputs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs text-text-muted mb-1">Start Date</label>
          <input
            type="date"
            value={cur.start_date}
            onChange={e => updateField('start_date', e.target.value)}
            className="input-field text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">End Date</label>
          <input
            type="date"
            value={cur.end_date}
            onChange={e => updateField('end_date', e.target.value)}
            className="input-field text-sm w-full"
          />
        </div>
      </div>

      {/* ── Progress Card ─────────────────────────────────────────────── */}
      {progress ? (
        <div
          className="p-5 rounded-xl border-2"
          style={{
            backgroundColor: 'var(--tm-accent-subtle)',
            borderColor: 'var(--tm-accent)',
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{cur.sub_header}</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {formatDate(progress.start)} – {formatDate(progress.end)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold" style={{ color: 'var(--tm-accent)' }}>
                Week {progress.weekNumber}
              </div>
              <div className="text-sm text-text-secondary">of {progress.totalWeeks}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--tm-surface)' }}
            >
              <p className="text-xs text-text-muted font-medium">Days Into Period</p>
              <p className="text-2xl font-bold text-text-primary">{progress.daysInto}</p>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--tm-surface)' }}
            >
              <p className="text-xs text-text-muted font-medium">Days Remaining</p>
              <p className="text-2xl font-bold text-text-primary">{progress.daysRemaining}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full rounded-full h-3"
            style={{ backgroundColor: 'var(--tm-surface)' }}
          >
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progress.pct}%`,
                backgroundColor: 'var(--tm-accent)',
              }}
            />
          </div>
          <p className="text-xs text-center mt-1.5 text-text-secondary font-medium">
            {progress.pct}% Complete
          </p>
        </div>
      ) : (
        <div
          className="p-5 rounded-xl border-2 border-border"
          style={{ backgroundColor: 'var(--tm-surface-raised)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-text-muted" />
            <h2 className="text-lg font-bold text-text-secondary">Not Currently In Session</h2>
          </div>
          <p className="text-sm text-text-muted">
            Today is outside the configured date range. Adjust the Start / End dates above.
          </p>
        </div>
      )}
    </div>
  );
};

export default BigPictureCalendar;
