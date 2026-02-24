"use client";

import { useState } from "react";
import type { StreamVideoClient, User } from "@stream-io/video-react-sdk";
import {StreamVideoClient as SDKClient} from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** After join, we have client + userId; token/apiKey for Chat captions; call is created inside StreamVideo context. */
export type JoinResult = {
  client: StreamVideoClient;
  userId: string;
  token: string;
  apiKey: string;
  userName: string;
};

type LobbyProps = {
  onJoined: (result: JoinResult) => void;
  /** When set (e.g. on /[callId] page), show invite link to copy. */
  callId?: string;
  /** Full URL to share (e.g. https://app.com/abc-123). */
  inviteLink?: string;
};

/** Stream user ids only allow a-z, 0-9, @, _, -. Sanitize input or return a safe fallback. */
function toStreamUserId(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return `user-${crypto.randomUUID().slice(0, 8)}`;
  const sanitized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9@_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return sanitized || `user-${crypto.randomUUID().slice(0, 8)}`;
}

export function Lobby({ onJoined, callId, inviteLink }: LobbyProps) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  }

  async function handleJoin() {
    setError(null);
    setLoading(true);
    try {
      const userId = toStreamUserId(displayName);
      const res = await fetch(`/api/stream-token?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Token failed: ${res.status}`);
      }
      const data = (await res.json()) as { token: string; apiKey: string; userId: string };
      const { token, apiKey } = data;

      const user: User = { id: userId, name: displayName.trim() || userId };
      const client = new SDKClient({ apiKey, user, token });

      onJoined({ client, userId, token, apiKey, userName: user.name ?? userId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign–Speech Bridge</CardTitle>
          <CardDescription>
            {callId
              ? "You’re joining a meeting. Enter your name and join."
              : "Join a meeting with the agent. Use your camera to sign; use your mic to speak."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          {inviteLink && (
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Share link</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={copyInviteLink}>
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={handleJoin}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Joining…" : "Join"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
