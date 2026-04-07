'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Code2,
  ExternalLink,
  FlaskConical,
  Globe,
  GraduationCap,
  Library,
  PenLine,
  PlayCircle,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { getLearningResources, LearningResource, LearningResourcesResponse } from '@/app/lib/ai-api';
import { stripHtml } from '@/app/utils/textUtils';

interface ResourceSidebarProps {
  noteContent: string;
  onClose: () => void;
}

// ── Icon + color resolution ───────────────────────────────────────────────────
//
// Video and article have fixed icons/colors.
// Exercise uses getExerciseIcon() — keyword-matches the freeform activity_label
// so domain-specific labels ("Case Study", "Technique Drill", etc.) get a
// semantically appropriate icon rather than always showing Code2.

const VIDEO_COLOR    = '#ef4444';
const ARTICLE_COLOR  = '#3b82f6';
const EXERCISE_COLOR = '#f59e0b';

function getExerciseIcon(activityLabel: string): React.ReactNode {
  const l = activityLabel.toLowerCase();
  if (l.includes('cod') || l.includes('program') || l.includes('script'))
    return <Code2 className="w-4 h-4" />;
  if (l.includes('quiz') || l.includes('flash') || l.includes('study') || l.includes('exam'))
    return <GraduationCap className="w-4 h-4" />;
  if (l.includes('lab') || l.includes('experiment') || l.includes('simulat') || l.includes('virtual'))
    return <FlaskConical className="w-4 h-4" />;
  if (l.includes('writ') || l.includes('essay') || l.includes('prompt') || l.includes('journal'))
    return <PenLine className="w-4 h-4" />;
  if (l.includes('tour') || l.includes('explor') || l.includes('museum') || l.includes('map'))
    return <Globe className="w-4 h-4" />;
  if (l.includes('drill') || l.includes('craft') || l.includes('build') || l.includes('cook') || l.includes('technique') || l.includes('hands'))
    return <Wrench className="w-4 h-4" />;
  return <Zap className="w-4 h-4" />;
}

function getResourceConfig(resource: LearningResource): { icon: React.ReactNode; color: string } {
  switch (resource.type) {
    case 'video':   return { icon: <PlayCircle className="w-4 h-4" />, color: VIDEO_COLOR };
    case 'article': return { icon: <BookOpen   className="w-4 h-4" />, color: ARTICLE_COLOR };
    case 'exercise': return { icon: getExerciseIcon(resource.activity_label), color: EXERCISE_COLOR };
  }
}

// ── ResourceCard ──────────────────────────────────────────────────────────────

const ResourceCard: React.FC<{ resource: LearningResource }> = ({ resource }) => {
  const { icon, color } = getResourceConfig(resource);
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2.5 p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{ backgroundColor: 'var(--tm-surface-raised)', borderColor: 'var(--tm-border)' }}
    >
      {/* Icon badge */}
      <div
        className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
        style={{ backgroundColor: color + '22', color }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {/* activity_label (bold accent) · platform name (muted) */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>
              {resource.activity_label}
            </span>
            <span className="text-xs truncate" style={{ color: 'var(--tm-text-muted)' }}>
              · {resource.platform}
            </span>
          </div>
          <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--tm-text-muted)' }} />
        </div>
        <p className="text-sm font-medium text-text-primary leading-tight line-clamp-2">
          {resource.title}
        </p>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{resource.why}</p>
      </div>
    </a>
  );
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    className="p-3 rounded-xl border animate-pulse"
    style={{ backgroundColor: 'var(--tm-surface-raised)', borderColor: 'var(--tm-border)' }}
  >
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--tm-surface)' }} />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-2.5 rounded w-1/3" style={{ backgroundColor: 'var(--tm-surface)' }} />
        <div className="h-3 rounded w-5/6" style={{ backgroundColor: 'var(--tm-surface)' }} />
        <div className="h-3 rounded w-4/6" style={{ backgroundColor: 'var(--tm-surface)' }} />
      </div>
    </div>
  </div>
);

// ── ResourceSidebar ───────────────────────────────────────────────────────────

const ResourceSidebar: React.FC<ResourceSidebarProps> = ({ noteContent, onClose }) => {
  const [data, setData]       = useState<LearningResourcesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const debounceRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedContent = useRef<string>('');

  useEffect(() => {
    const plain = stripHtml(noteContent);

    // Skip if content hasn't meaningfully changed or is too short
    if (plain.length < 30 || plain === lastFetchedContent.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      lastFetchedContent.current = plain;
      setLoading(true);
      setError(false);
      try {
        const result = await getLearningResources(noteContent);
        setData(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [noteContent]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--tm-surface)' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border-subtle flex-shrink-0"
        style={{ backgroundColor: 'var(--tm-surface-raised)' }}
      >
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4" style={{ color: 'var(--tm-accent)' }} />
          <span className="text-sm font-semibold text-text-primary">Smart Resources</span>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="p-1.5 rounded-md transition-colors hover:opacity-70"
          style={{ color: 'var(--tm-text-secondary)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-custom space-y-2">

        {/* Empty / waiting state */}
        {!loading && !error && !data && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Library className="w-8 h-8 mb-3" style={{ color: 'var(--tm-text-muted)' }} />
            <p className="text-sm text-text-muted leading-relaxed">
              Write or paste notes to get AI-curated resources for your topic.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--tm-danger)' }}>
            Could not fetch resources.
          </p>
        )}

        {/* Results */}
        {!loading && !error && data && data.resources.length > 0 && (
          <>
            {/* Topic label */}
            <div className="px-1 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--tm-text-muted)' }}>
                Detected topic
              </p>
              <p className="text-sm font-medium text-text-primary mt-0.5">{data.topic}</p>
            </div>

            {data.resources.map((resource, i) => (
              <ResourceCard key={i} resource={resource} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ResourceSidebar;
