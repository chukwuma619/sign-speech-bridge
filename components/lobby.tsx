"use client";

import { useState } from "react";
import type { StreamVideoClient, User } from "@stream-io/video-react-sdk";
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

/** After join, we have client + userId; call is created inside StreamVideo context. */
export type JoinResult = { client: StreamVideoClient; userId: string };

type LobbyProps = {
  onJoined: (result: JoinResult) => void;
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

export function Lobby({ onJoined }: LobbyProps) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { token, apiKey } = (await res.json()) as { token: string; apiKey: string; userId: string };

      const { StreamVideoClient: SDKClient } = await import("@stream-io/video-react-sdk");
      const user: User = { id: userId, name: displayName.trim() || userId };
      const client = new SDKClient({ apiKey, user, token });

      onJoined({ client, userId });
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
            Join a call with the agent. Use your camera to sign; use your mic to speak.
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
            {loading ? "Joining…" : "Join call"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
