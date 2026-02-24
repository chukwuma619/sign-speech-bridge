"use client";

import { useEffect, useRef, useState } from "react";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";
import { StreamVideo } from "@stream-io/video-react-sdk";
import { createAgentSession } from "@/lib/stream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type JoinCallProps = {
  client: StreamVideoClient;
  userId: string;
  onReady: (call: Call) => void;
  onError: (message: string) => void;
};

/**
 * Runs inside StreamVideo(client). Creates the call, joins, spawns the agent, then calls onReady(call).
 * Joining must happen inside the StreamVideo context so client state (e.g. call type settings) is available.
 */
function JoinCallInner({ client, userId, onReady, onError }: JoinCallProps) {
  const [status, setStatus] = useState("Connecting…");
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const callType = "default";
    const callId = crypto.randomUUID();
    const call = client.call(callType, callId);

    (async () => {
      try {
        setStatus("Starting agent…");
        await createAgentSession(callType, callId);
        if (cancelled) return;
        setStatus("Joining call…");
        await new Promise((r) => setTimeout(r, 1500));
        if (cancelled) return;
        await call.join({ create: false });
        if (cancelled) return;
        await call.camera.enable().catch(() => {});
        await call.microphone.enable().catch(() => {});
        if (cancelled) return;
        onReadyRef.current(call);
      } catch (e) {
        if (!cancelled) {
          onErrorRef.current(e instanceof Error ? e.message : "Failed to join");
        }
      }
    })();

    return () => {
      cancelled = true;
      call.leave().catch(() => {});
    };
  }, [client, userId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign–Speech Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function JoinCall(props: JoinCallProps) {
  return (
    <StreamVideo client={props.client}>
      <JoinCallInner {...props} />
    </StreamVideo>
  );
}
