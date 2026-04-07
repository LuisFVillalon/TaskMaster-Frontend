/*
  StatsCard renders one of two distinct stat cards depending on the `variant` prop.

  variant="tasks"  — Total / Completed / In Progress / Urgent counts + per-tag breakdown
  variant="notes"  — Total / Tagged counts + per-tag note breakdown
*/

import React from 'react';
import { FileText, CheckSquare } from 'lucide-react';
import { TagStats } from '@/app/types/task';

// ── Prop types ────────────────────────────────────────────────────────────────

type TasksVariant = {
  variant: 'tasks';
  total: number;
  completed: number;
  active: number;   // in-progress (not completed, not urgent)
  urgent: number;
  tags: TagStats[];
};

type NotesVariant = {
  variant: 'notes';
  noteCount: number;
  taggedCount: number;   // notes that have ≥1 tag
  noteTags: TagStats[];
};

type StatsCardProps = TasksVariant | NotesVariant;

// ── Shared sub-components ─────────────────────────────────────────────────────

interface CardShellProps {
  icon: React.ReactNode;
  header: string;
  children: React.ReactNode;
}

const CardShell: React.FC<CardShellProps> = ({ icon, header, children }) => (
  <div className="card p-3 sm:p-4 lg:p-5 flex flex-col gap-3">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] xs:text-xs sm:text-sm text-text-muted font-medium uppercase tracking-wide">
        {header}
      </span>
    </div>
    {children}
  </div>
);

interface StatPillProps {
  label: string;
  value: number;
  color: string;
}

const StatPill: React.FC<StatPillProps> = ({ label, value, color }) => (
  <div
    className="flex flex-col items-start px-3 py-2 rounded-lg"
    style={{ backgroundColor: 'var(--tm-surface-raised)' }}
  >
    <span className="text-[10px] text-text-muted font-medium leading-none mb-1">{label}</span>
    <span className="text-2xl sm:text-xl lg:text-2xl font-bold leading-none" style={{ color }}>
      {value}
    </span>
  </div>
);

interface TagChipsProps {
  tags: TagStats[];
  icon?: React.ReactNode;
}

const TagChips: React.FC<TagChipsProps> = ({ tags, icon }) => {
  if (tags.length === 0) {
    return <p className="text-[10px] xs:text-xs text-text-muted italic">No tags</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-x-3 sm:gap-y-1.5">
      {tags.map(tag => (
        <span
          key={tag.name}
          style={{ backgroundColor: tag.color ?? 'var(--tm-accent)', color: 'white' }}
          className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[10px] xs:text-xs font-medium whitespace-nowrap shadow-sm hover:shadow transition-shadow"
        >
          {icon}
          {tag.name} ({tag.count})
        </span>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const StatsCard: React.FC<StatsCardProps> = (props) => {

  if (props.variant === 'tasks') {
    const { total, completed, active, urgent, tags } = props;
    return (
      <CardShell
        icon={<CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--tm-accent)' }} />}
        header="Tasks"
      >
        {/* 2×2 status grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatPill label="Total"       value={total}     color="var(--tm-accent)" />
          <StatPill label="Completed"   value={completed} color="#85BB65" />
          <StatPill label="In Progress" value={active}    color="#3B82F6" />
          <StatPill label="Urgent"      value={urgent}    color="#EF4444" />
        </div>

        {/* Per-tag breakdown */}
        <TagChips tags={tags} />
      </CardShell>
    );
  }

  // variant === 'notes'
  const { noteCount, taggedCount, noteTags } = props;
  return (
    <CardShell
      icon={<FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--tm-accent)' }} />}
      header="Notes"
    >
      {/* 1×2 count row */}
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Total"  value={noteCount}   color="var(--tm-accent)" />
        <StatPill label="Tagged" value={taggedCount} color="#A855F7" />
      </div>

      {/* Per-tag breakdown */}
      <TagChips
        tags={noteTags}
        icon={<FileText className="w-2.5 h-2.5 flex-shrink-0" />}
      />
    </CardShell>
  );
};

export default StatsCard;
