'use client';

/**
 * useGoogleCalendar — manages Google Calendar connection state and event fetching.
 *
 * Authorization strategy: Incremental Authorization via GSI popup.
 * 1. Load the Google Identity Services (GSI) script dynamically.
 * 2. On connect(): open the GSI popup, receive an authorization code.
 * 3. POST the code to our backend proxy which stores the tokens.
 * 4. On sync(timeMin, timeMax): fetch events through the backend proxy
 *    (keeps the Client Secret server-side).
 *
 * The hook is independent of the Supabase Google OAuth sign-in flow — it
 * works for both email/password and Google-signed-in users.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  fetchGoogleCalendarEvents,
  getGoogleCalendarStatus,
} from '@/app/lib/backend-api';
import { GoogleCalendarEvent } from '@/app/types/calendar';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
// GSI automatically appends the OpenID Connect scopes; declare them
// explicitly so the backend scope validation passes without error.
const CALENDAR_SCOPE = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

// GSI type shim — avoids a hard dependency on @types/google.accounts
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup';
            callback: (response: { code?: string; error?: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

export type GCalStatus = 'unknown' | 'connected' | 'disconnected' | 'loading';

export interface UseGoogleCalendarReturn {
  /** Current connection state. */
  gcalStatus: GCalStatus;
  /** Events fetched for the last requested time range. */
  googleEvents: GoogleCalendarEvent[];
  /** True while a sync request is in-flight. */
  googleSyncing: boolean;
  /** Last error message, or null. */
  gcalError: string | null;
  /** Open the GSI consent popup to connect Google Calendar. */
  connectGcal: () => void;
  /** Revoke tokens and disconnect. */
  disconnectGcal: () => Promise<void>;
  /** Fetch events for the given ISO 8601 time range. */
  syncGcal: (timeMin: string, timeMax: string) => Promise<void>;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [gcalStatus, setGcalStatus] = useState<GCalStatus>('unknown');
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [gcalError, setGcalError] = useState<string | null>(null);
  const gsiReadyRef = useRef(false);

  // ── Load the GSI script once ───────────────────────────────────────────────
  useEffect(() => {
    if (document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`)) {
      gsiReadyRef.current = true;
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => { gsiReadyRef.current = true; };
    document.head.appendChild(script);
  }, []);

  // ── Check connection status on mount ──────────────────────────────────────
  useEffect(() => {
    getGoogleCalendarStatus()
      .then(({ connected }) => setGcalStatus(connected ? 'connected' : 'disconnected'))
      .catch(() => setGcalStatus('disconnected'));
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connectGcal = useCallback(() => {
    if (!CLIENT_ID) {
      setGcalError('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.');
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      setGcalError('Google Identity Services has not loaded yet. Try refreshing the page.');
      return;
    }
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      scope: CALENDAR_SCOPE,
      ux_mode: 'popup',
      callback: async (response) => {
        if (!response.code) {
          setGcalError('Authorization was cancelled or an error occurred.');
          return;
        }
        setGcalStatus('loading');
        setGcalError(null);
        try {
          await connectGoogleCalendar(response.code);
          setGcalStatus('connected');
        } catch (err) {
          setGcalStatus('disconnected');
          setGcalError(err instanceof Error ? err.message : 'Failed to connect Google Calendar.');
        }
      },
    });
    client.requestCode();
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectGcal = useCallback(async () => {
    setGcalStatus('loading');
    setGcalError(null);
    try {
      await disconnectGoogleCalendar();
      setGoogleEvents([]);
      setGcalStatus('disconnected');
    } catch (err) {
      setGcalStatus('connected');
      setGcalError(err instanceof Error ? err.message : 'Failed to disconnect Google Calendar.');
    }
  }, []);

  // ── Sync (fetch events) ───────────────────────────────────────────────────
  const syncGcal = useCallback(async (timeMin: string, timeMax: string) => {
    if (gcalStatus !== 'connected') return;
    setGoogleSyncing(true);
    setGcalError(null);
    try {
      const data = await fetchGoogleCalendarEvents(timeMin, timeMax);
      setGoogleEvents(data);
    } catch (err) {
      // If the backend says the token was revoked, flip to disconnected.
      if (err instanceof Error && err.message.includes('reconnect')) {
        setGcalStatus('disconnected');
        setGoogleEvents([]);
      }
      setGcalError(err instanceof Error ? err.message : 'Failed to fetch Google Calendar events.');
    } finally {
      setGoogleSyncing(false);
    }
  }, [gcalStatus]);

  return { gcalStatus, googleEvents, googleSyncing, gcalError, connectGcal, disconnectGcal, syncGcal };
}
