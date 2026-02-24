"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StreamChat } from "stream-chat";
import type { MessageResponse } from "stream-chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_CAPTIONS = 50;

type LiveCaptionsProps = {
  callId: string;
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
};

/**
 * Subscribes to the call's Stream Chat channel (messaging:{callId}) and displays
 * agent transcript messages as live captions (Speech → Sign for the signer).
 */
export function LiveCaptions({
  callId,
  apiKey,
  token,
  userId,
  userName,
}: LiveCaptionsProps) {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; from: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<StreamChat | null>(null);
  const channelRef = useRef<ReturnType<StreamChat["channel"]> | null>(null);

  const addMessage = useCallback((msg: MessageResponse) => {
    const text = (typeof msg.text === "string" ? msg.text : String(msg.text ?? "")).trim();
    if (!text) return;
    const from = (msg.user?.name as string) ?? (msg.user_id as string) ?? "Agent";
    setMessages((prev) => {
      const next = [...prev, { id: msg.id ?? String(Date.now()), text, from }];
      return next.slice(-MAX_CAPTIONS);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const client = StreamChat.getInstance(apiKey);
    clientRef.current = client;

    (async () => {
      try {
        await client.connectUser(
          { id: userId, name: userName },
          token,
        );
        if (cancelled) return;
        setConnected(true);

        const channel = client.channel("messaging", callId);
        channelRef.current = channel;

        await channel.watch();
        if (cancelled) return;

        const existing = channel.state?.messages ?? [];
        setMessages(
          existing
            .filter((m) => m.text)
            .map((m) => ({
              id: m.id ?? "",
              text: typeof m.text === "string" ? m.text : "",
              from: (m.user?.name as string) ?? (m.user_id as string) ?? "Agent",
            }))
            .slice(-MAX_CAPTIONS),
        );

        const handleNew = (event: { message?: MessageResponse }) => {
          if (event.message) addMessage(event.message);
        };
        channel.on("message.new", handleNew);

        return () => {
          channel.off("message.new", handleNew);
        };
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load captions");
        }
      }
    })();

    return () => {
      cancelled = true;
      const ch = channelRef.current;
      if (ch) ch.stopWatching().catch(() => {});
      client.disconnectUser().catch(() => {});
      clientRef.current = null;
      channelRef.current = null;
    };
  }, [apiKey, token, userId, userName, callId, addMessage]);

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Live captions</CardTitle>
          <CardDescription>Speech from the agent will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live captions</CardTitle>
        <CardDescription>
          {connected
            ? "Speech from the agent and others will appear here (Speech → Sign)."
            : "Connecting…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {messages.length === 0 && connected && (
          <p className="text-sm italic text-muted-foreground">Waiting for speech…</p>
        )}
        <ul className="space-y-1.5 text-sm">
          {messages.map((m) => (
            <li key={m.id} className="rounded bg-muted/50 px-2 py-1">
              <span className="font-medium text-muted-foreground">{m.from}:</span>{" "}
              {m.text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
