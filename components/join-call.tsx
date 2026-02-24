"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";
import {
  DeviceSettings,
  StreamCall,
  StreamTheme,
  StreamVideo,
  VideoPreview,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { createAgentSession } from "@/lib/stream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type JoinCallProps = {
  client: StreamVideoClient;
  userId: string;
  onReady: (call: Call) => void;
  onError: (message: string) => void;
  /** When provided (e.g. from /[callId] page), use this call ID instead of generating one. */
  callId?: string;
  /** When true (creator of the call), start the agent session. When false (invitee), only join. */
  isCreator?: boolean;
  /** Called after agent session is successfully created (so creator flag can be cleared). */
  onCreatorSessionStarted?: () => void;
  /** Called when user cancels from the pre-join screen (go back to lobby). */
  onCancel?: () => void;
};

const callType = "default";

/**
 * Google Meet–like pre-join: preview camera/mic and device selection before joining.
 */
function PrejoinView({
  call,
  onJoin,
  onCancel,
}: {
  call: Call;
  onJoin: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    call.camera.enable().catch(console.error);
    call.microphone.enable().catch(console.error);
  }, [call]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle>Ready to join?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Check your camera and microphone, then join the meeting.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <StreamTheme>
              <VideoPreview className="h-full w-full object-cover" mirror />
            </StreamTheme>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Device settings</p>
            <StreamTheme>
              <DeviceSettings />
            </StreamTheme>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="flex-1" onClick={onJoin}>
              Join now
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Runs inside StreamVideo(client). Shows pre-join (Meet-style), then optionally starts the agent and joins.
 */
function JoinCallInner({
  client,
  onReady,
  onError,
  callId: callIdProp,
  isCreator = false,
  onCreatorSessionStarted,
  onCancel,
}: JoinCallProps) {
  const [phase, setPhase] = useState<"prejoin" | "joining">("prejoin");
  const [status, setStatus] = useState("Connecting…");
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onCreatorStartedRef = useRef(onCreatorSessionStarted);

  const callId = callIdProp ?? crypto.randomUUID();
  const call = useMemo(() => client.call(callType, callId), [client, callId]);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    onCreatorStartedRef.current = onCreatorSessionStarted;
  }, [onReady, onError, onCreatorSessionStarted]);

  const startedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (phase !== "joining" || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const log = (step: string, detail?: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[JoinCall]", step, detail !== undefined ? detail : "");
      }
    };

    (async () => {
      try {
        log("start", { callId, isCreator });
        if (isCreator) {
          setStatus("Starting agent…");
          await createAgentSession(callType, callId);
          onCreatorStartedRef.current?.();
          if (cancelled) return;
        }
        setStatus("Joining…");
        await new Promise((r) => setTimeout(r, isCreator ? 1500 : 500));
        if (cancelled) return;
        await call.join({ create: false });
        if (cancelled) return;
        await call.camera.enable().catch((err) => log("camera.enable: error", err));
        await call.microphone.enable().catch((err) => log("microphone.enable: error", err));
        if (cancelled) return;
        completedRef.current = true;
        onReadyRef.current(call);
      } catch (e) {
        if (!cancelled) {
          onErrorRef.current(e instanceof Error ? e.message : "Failed to join");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (!completedRef.current) {
        call.leave().catch(() => {});
        startedRef.current = false;
      }
    };
  }, [phase, call, callId, isCreator]);

  if (phase === "prejoin") {
    return (
      <StreamCall call={call}>
        <PrejoinView
          call={call}
          onJoin={() => setPhase("joining")}
          onCancel={() => onCancel?.()}
        />
      </StreamCall>
    );
  }

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
