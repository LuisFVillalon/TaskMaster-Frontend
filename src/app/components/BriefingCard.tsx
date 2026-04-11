'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Newspaper, RefreshCw, ChevronUp, ChevronDown, Zap, Clock, AlertCircle } from 'lucide-react';
import { generateDailyBriefing, DailyBriefingResult } from '@/app/lib/ai-api';

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key:   'pulse'   as const,
    label: 'The Pulse',
    Icon:  Zap,
    color: 'var(--tm-accent)',
  },
  {
    key:   'timeline' as const,
    label: 'The Timeline',
    Icon:  Clock,
    color: '#059669',  // emerald — same as confirmed work-block green
  },
  {
    key:   'action_items' as const,
    label: 'Action Items',
    Icon:  AlertCircle,
    color: 'var(--tm-warning)',
  },
] as const;

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {SECTIONS.map(s => (
        <div key={s.key} className="space-y-1.5">
          <div className="h-2.5 rounded w-24" style={{ backgroundColor: 'var(--tm-surface-raised)' }} />
          <div className="h-3 rounded w-full"    style={{ backgroundColor: 'var(--tm-surface-raised)' }} />
          <div className="h-3 rounded w-5/6"     style={{ backgroundColor: 'var(--tm-surface-raised)' }} />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const BriefingCard: React.FC = () => {
  const [briefing,   setBriefing]   = useState<DailyBriefingResult | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    setError(false);
    if (forceRefresh) setRefreshing(true);
    else              setLoading(true);

    try {
      const result = await generateDailyBriefing(forceRefresh);
      setBriefing(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => load(true);

  return (
    <div className="card p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper size={18} style={{ color: 'var(--tm-accent)' }} />
          <span className="font-semibold text-text-primary text-sm sm:text-base">Daily Briefing</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Refresh briefing"
            className="p-1.5 rounded-md transition-colors hover:opacity-70 disabled:opacity-30"
            style={{ color: 'var(--tm-text-secondary)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className="p-1.5 rounded-md transition-colors hover:opacity-70"
            style={{ color: 'var(--tm-text-secondary)' }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {!collapsed && (
        <>
          {loading && <SectionSkeleton />}

          {!loading && error && (
            <p className="text-sm" style={{ color: 'var(--tm-danger)' }}>
              Could not generate briefing.{' '}
              <button
                onClick={handleRefresh}
                className="underline hover:opacity-70"
                style={{ color: 'var(--tm-danger)' }}
              >
                Try again
              </button>
            </p>
          )}

          {!loading && !error && briefing && (
            <div className="space-y-4">
              {SECTIONS.map(({ key, label, Icon, color }) => {
                const value = briefing[key];
                const isEmpty =
                  !value || (Array.isArray(value) ? value.length === 0 : !String(value).trim());
                if (isEmpty) return null;

                return (
                  <div key={key}>
                    {/* Section header */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon size={13} style={{ color }} />
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color }}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Section body */}
                    {key === 'action_items' ? (
                      <ul className="space-y-1">
                        {(value as string[]).map((item, i) => (
                          <li
                            key={i}
                            className="text-sm leading-snug pl-3 relative"
                            style={{ color: 'var(--tm-text-secondary)' }}
                          >
                            {/* Bullet dot */}
                            <span
                              className="absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /* pulse / timeline — prose paragraph */
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--tm-text-secondary)' }}
                      >
                        {value as string}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BriefingCard;
