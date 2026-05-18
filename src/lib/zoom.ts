/**
 * Zoom Server-to-Server OAuth utility library.
 *
 * Handles token caching, meeting creation (with cloud auto-recording for 1-v-1
 * sessions), recording retrieval, and meeting deletion.
 */

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID!;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID!;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET!;

// ---------------------------------------------------------------------------
// Token cache (module-level; lives for the lifetime of the server process)
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch ms

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60 s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "account_credentials",
      account_id: ZOOM_ACCOUNT_ID,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom OAuth error (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token as string;
  // Zoom tokens are valid for 1 hour; cache until expiry
  tokenExpiresAt = Date.now() + (data.expires_in as number) * 1000;

  return cachedToken;
}

// ---------------------------------------------------------------------------
// Helper to call the Zoom REST API
// ---------------------------------------------------------------------------
async function zoomFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`https://api.zoom.us/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ZoomMeetingResult {
  meeting_id: string;
  join_url: string;
  start_url: string;
}

/**
 * Create a scheduled Zoom meeting with cloud auto-recording.
 *
 * Schedules under the teacher's own Zoom user (looked up by email) when
 * one is provided so multiple teachers can hold meetings in parallel.
 * A single Zoom user can only be in one live meeting at a time, so
 * funnelling every session through the account owner caused
 * "host already in meeting" errors whenever sessions overlapped.
 * Falls back to ZOOM_HOST_EMAIL (or "me") if the teacher isn't yet a
 * Zoom user, listing them as an alternative host so they can still
 * start the meeting.
 */
export async function createZoomMeeting(
  topic: string,
  startTime: string,
  duration: number,
  hostEmail?: string
): Promise<ZoomMeetingResult> {
  const fallbackHost = process.env.ZOOM_HOST_EMAIL || "me";
  const teacherHost = hostEmail?.trim();
  const primaryHost = teacherHost || fallbackHost;

  const baseSettings = {
    auto_recording: "cloud",
    // Students must wait for the teacher (host) to start the meeting.
    // Without this, the first participant to join has end-meeting power
    // until the host arrives.
    join_before_host: false,
    waiting_room: false,
    meeting_authentication: false,
  } as Record<string, unknown>;

  const requestBody = {
    topic,
    type: 2, // scheduled
    start_time: startTime, // ISO 8601
    duration,
    timezone: "UTC",
    settings: { ...baseSettings },
  };

  let res = await zoomFetch(
    `/users/${encodeURIComponent(primaryHost)}/meetings`,
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    }
  );

  // If the teacher isn't a Zoom user yet, retry under the account owner
  // so session creation still succeeds with the teacher as alt host.
  if (
    !res.ok &&
    teacherHost &&
    teacherHost !== fallbackHost &&
    res.status === 404
  ) {
    console.warn(
      `Zoom user "${teacherHost}" not found; falling back to "${fallbackHost}" host with teacher as alternative host`
    );
    res = await zoomFetch(
      `/users/${encodeURIComponent(fallbackHost)}/meetings`,
      {
        method: "POST",
        body: JSON.stringify({
          ...requestBody,
          settings: { ...baseSettings, alternative_hosts: teacherHost },
        }),
      }
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom create meeting error (${res.status}): ${text}`);
  }

  const data = await res.json();

  return {
    meeting_id: String(data.id),
    join_url: data.join_url,
    start_url: data.start_url,
  };
}

export interface ZoomRecording {
  download_url: string;
  file_type: string;
  file_size: number;
  recording_start: string;
  recording_end: string;
}

/**
 * Fetch cloud recordings for a given meeting.
 */
export async function getZoomRecordings(
  meetingId: string
): Promise<ZoomRecording[]> {
  const res = await zoomFetch(`/meetings/${meetingId}/recordings`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom recordings error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const files: any[] = data.recording_files || [];

  return files.map((f) => ({
    download_url: f.download_url,
    file_type: f.file_type,
    file_size: f.file_size,
    recording_start: f.recording_start,
    recording_end: f.recording_end,
  }));
}

/**
 * Delete a Zoom meeting.
 */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const res = await zoomFetch(`/meetings/${meetingId}`, {
    method: "DELETE",
  });

  // 204 = success, 404 = already deleted
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Zoom delete meeting error (${res.status}): ${text}`);
  }
}
