'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Newspaper, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { Task } from '@/app/types/task';
import { Note } from '@/app/types/notes';
import { generateDailyBriefing } from '@/app/lib/ai-api';

interface BriefingCardProps {
  tasks: Task[];
  notes: Note[];
}

const BriefingCard: React.FC<BriefingCardProps> = ({ tasks, notes }) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    setError(false);
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const text = await generateDailyBriefing(tasks, notes, forceRefresh);
      setBriefing(text);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tasks, notes]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => load(true);

  return (
    <div className="card p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper
            size={18}
            style={{ color: 'var(--tm-accent)' }}
          />
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

      {/* Body */}
      {!collapsed && (
        <>
          {loading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 rounded w-full" style={{ backgroundColor: 'var(--tm-surface-raised)' }} />
              <div className="h-3 rounded w-5/6" style={{ backgroundColor: 'var(--tm-surface-raised)' }} />
              <div className="h-3 rounded w-4/6" style={{ backgroundColor: 'var(--tm-surface-raised)' }} />
            </div>
          )}

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
            <div className="space-y-2">
              {briefing
                .split(/(?<=[.!?])\s+/)
                .filter(s => s.trim().length > 0)
                .map((sentence, i) => (
                  <p key={i} className="text-sm text-text-secondary leading-relaxed">
                    {sentence}
                  </p>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BriefingCard;
