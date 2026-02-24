/**
 * Agent server base URL for spawning sessions (Phase 2).
 * Set NEXT_PUBLIC_AGENT_SERVER_URL in .env.local (e.g. http://localhost:8000).
 */
export function getAgentServerUrl(): string {
  return process.env.NEXT_PUBLIC_AGENT_SERVER_URL ?? "http://localhost:8000";
}

export async function createAgentSession(callType: string, callId: string) {
  const base = getAgentServerUrl();
  const res = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_type: callType, call_id: callId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agent session failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ session_id: string; call_id: string }>;
}
