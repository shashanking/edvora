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
 * Uses type 2 (scheduled), join_before_host enabled, waiting room disabled,
 * and auto_recording set to "cloud" so every 1-v-1 session is recorded
 * automatically.
 */
export async function createZoomMeeting(
  topic: string,
  startTime: string,
  duration: number,
  _hostEmail?: string
): Promise<ZoomMeetingResult> {
  // Use the Zoom account owner email for all meetings.
  // The teacher's LMS email doesn't need to match a Zoom licensed user.
  const zoomHost = process.env.ZOOM_HOST_EMAIL || "me";
  const res = await zoomFetch(`/users/${zoomHost}/meetings`, {
    method: "POST",
    body: JSON.stringify({
      topic,
      type: 2, // scheduled
      start_time: startTime, // ISO 8601
      duration,
      timezone: "UTC",
      settings: {
        auto_recording: "cloud",
        join_before_host: true,
        waiting_room: false,
        meeting_authentication: false,
      },
    }),
  });

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
