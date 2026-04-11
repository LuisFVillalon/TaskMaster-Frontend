import { toLocalDateStr } from "../utils/dateUtils";
import { supabase } from "./supabase";
const API_AI_URL = process.env.NEXT_PUBLIC_TASKMASTER_AI_URL!;

// ── Daily Briefing ────────────────────────────────────────────────────────────

// Cache key is namespaced by the real Supabase user ID so multiple accounts on
// the same browser never share a cached briefing.
const briefingCacheKey = (userId: string) => `taskmaster_daily_briefing_v4_${userId}`;

/**
 * Structured briefing response returned by the AI service.
 * Rendered as three visually distinct sections in BriefingCard.
 */
export interface DailyBriefingResult {
  /** 2–3 sentence overall day-load assessment. */
  pulse: string;
  /** 3–5 sentence chronological narrative connecting events, blocks, and deadlines. */
  timeline: string;
  /** One actionable string per at-risk task that still needs scheduling. */
  action_items: string[];
}

interface BriefingCache {
  date: string;   // "YYYY-MM-DD"
  briefing: DailyBriefingResult;
}

/**
 * Request a structured daily briefing from the AI service.
 *
 * The service now fetches all data itself (tasks, work blocks, calendar events,
 * notes) using the forwarded Supabase JWT — the frontend only needs to provide
 * authentication.  This removes the risk of stale props and ensures the briefing
 * always reflects the live state of the user's data.
 *
 * The result is cached in localStorage for the current calendar day so the LLM
 * is only called once per day.  Pass `forceRefresh = true` to bypass the cache.
 */
export async function generateDailyBriefing(
  forceRefresh = false,
): Promise<DailyBriefingResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const userId   = session.user.id;
  const today    = toLocalDateStr(new Date());
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

  // Detect the browser's IANA timezone (e.g. "America/Los_Angeles") so the
  // server can localise all timestamp labels before they reach the LLM.
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const res = await fetch(`${API_AI_URL}/daily-briefing`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'X-Timezone':    userTimezone,
    },
    body: '{}',   // server fetches all data itself
  });

  if (!res.ok) throw new Error('Failed to generate daily briefing');

  const { briefing } = await res.json() as { briefing: DailyBriefingResult };

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ date: today, briefing }));
  } catch {
    // Ignore storage quota errors
  }

  return briefing;
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
