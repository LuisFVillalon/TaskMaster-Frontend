import { Task, WorkBlock } from "../types/task";
import { Note } from "../types/notes";
import { toLocalDateStr } from "../utils/dateUtils";
import { supabase } from "./supabase";
const API_AI_URL = process.env.NEXT_PUBLIC_TASKMASTER_AI_URL!;

// ── Daily Briefing ────────────────────────────────────────────────────────────

// Cache key is namespaced by user ID so multiple accounts on the same browser
// never share a cached briefing.
const briefingCacheKey = (userId: string) => `taskmaster_daily_briefing_${userId}`;

interface BriefingCache {
  date: string;   // "YYYY-MM-DD"
  briefing: string;
}

/** Enriched task shape sent to the AI briefing endpoint. */
interface BriefingTask {
  id: number;
  title: string;
  completed: boolean;
  urgent: boolean;
  due_date: string | null;
  tags: { id: number; name: string; color: string }[];
  /** Derived from urgent + complexity: 'high' | 'medium-high' | 'normal' */
  priority_level: 'high' | 'medium-high' | 'normal';
  category?: string | null;
  complexity?: number | null;
}

/** Enriched note shape sent to the AI briefing endpoint. */
interface BriefingNote {
  id: number;
  title: string;
  /** Raw note body (Tiptap HTML) so the AI can match it to tasks. */
  note_content: string;
  tags: { id: number; name: string; color: string }[];
  updated_date: string;
}

function toPriorityLevel(task: Task): BriefingTask['priority_level'] {
  if (task.urgent) return 'high';
  if ((task.complexity ?? 0) >= 4) return 'medium-high';
  return 'normal';
}

/**
 * Generate a 3-4 sentence strategic daily briefing from the user's tasks and notes.
 * The response is cached in localStorage for the current calendar day so the
 * LLM is only called once per day per browser session.
 *
 * Pass `forceRefresh = true` to bypass the cache (e.g., from a Refresh button).
 */
export async function generateDailyBriefing(
  tasks: Task[],
  notes: Note[],
  forceRefresh = false,
  userId = 'default',
): Promise<string> {
  // Use local date (not UTC) so the cache key never drifts on US West Coast etc.
  const now = new Date();
  const today = toLocalDateStr(now);
  const cacheKey = briefingCacheKey(userId);

  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw) as BriefingCache;
        if (cached.date === today && cached.briefing) return cached.briefing;
      }
    } catch {
      // Corrupted cache — fall through to API call
    }
  }

  const briefingTasks: BriefingTask[] = tasks.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    urgent: t.urgent,
    // Timezone-safe: avoid new Date().toISOString() which converts to UTC
    due_date: t.due_date ? toLocalDateStr(t.due_date) : null,
    tags: t.tags,
    priority_level: toPriorityLevel(t),
    category: t.category ?? null,
    complexity: t.complexity ?? null,
  }));

  const briefingNotes: BriefingNote[] = notes.map(n => ({
    id: n.id,
    title: n.title,
    note_content: n.content,
    tags: n.tags,
    updated_date: n.updated_date,
  }));

  const res = await fetch(`${API_AI_URL}/daily-briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: briefingTasks, notes: briefingNotes }),
  });

  if (!res.ok) throw new Error('Failed to generate daily briefing');

  const { briefing } = await res.json();

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ date: today, briefing }));
  } catch {
    // Ignore storage quota errors
  }

  return briefing as string;
}

// ── Learning Resources ────────────────────────────────────────────────────────

export interface LearningResource {
  type: 'video' | 'article' | 'exercise';
  title: string;
  /** Real platform search URL — never a hallucinated direct link. */
  url: string;
  /** AI-generated "why this helps" blurb, under 15 words. */
  why: string;
  /** Authoritative source name: "YouTube", "Harvard Business Review", "The Art Story", etc. */
  platform: string;
  /**
   * Human-readable action label for the UI badge. Fixed for video ("Watch") and article ("Read").
   * Freeform for exercise — domain-specific: "Case Study", "Technique Drill", "Grammar Exercise", etc.
   */
  activity_label: string;
}

export interface LearningResourcesResponse {
  topic: string;
  resources: LearningResource[];
}

/**
 * Analyze note content and return 3 curated learning resources (video, article,
 * interactive exercise). Links are real platform search URLs, never LLM-generated
 * direct links that might be hallucinated.
 */
export async function getLearningResources(
  noteContent: string,
): Promise<LearningResourcesResponse> {
  const res = await fetch(`${API_AI_URL}/learning-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_content: noteContent }),
  });
  if (!res.ok) throw new Error('Failed to get learning resources');
  return res.json();
}

// ── Smart Scheduling ──────────────────────────────────────────────────────────

/**
 * Ask the AI service to find the best work slot for a task.
 * Forwards the user's JWT so the AI service can persist the result to the backend.
 * Returns the persisted WorkBlock (status = 'suggested').
 *
 * Throws a descriptive error string on failure, including the structured
 * "no_available_slots" message from the backend when no slots are available.
 */
export async function requestScheduleSuggestion(task: Task): Promise<WorkBlock> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const due_date = task.due_date
    ? (typeof task.due_date === 'string' ? task.due_date.slice(0, 10) : toLocalDateStr(task.due_date as Date))
    : null;

  if (!due_date) throw new Error("Task has no due date — add one before scheduling.");

  const res = await fetch(`${API_AI_URL}/schedule-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      task_id:         task.id,
      title:           task.title,
      due_date,
      estimated_hours: task.estimated_time ?? null,
      complexity:      task.complexity ?? null,
      tags:            task.tags?.map(t => t.name) ?? [],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 422 && typeof body?.detail === 'object') {
      throw new Error(body.detail.message ?? 'No available time slots before this deadline.');
    }
    throw new Error(
      typeof body?.detail === 'string' ? body.detail : 'Failed to schedule task.'
    );
  }

  return res.json();
}

/**
 * Sends a task to the AI service to generate a step-by-step sub-task plan.
 * Returns an array of AI-generated sub-tasks.
 */
export async function sendNewTaskToAIAPI(task: Task) {
  const res = await fetch(`${API_AI_URL}/plan-tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    throw new Error("Failed to send new task to AI");
  }

  return res.json();
}
