"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lobby } from "@/components/lobby";
import { Button } from "@/components/ui/button";
import { JoinCall } from "@/components/join-call";
import { CallView } from "@/components/call-ui";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";

const CREATOR_KEY_PREFIX = "sign-speech-bridge-creator-";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidCallId(id: string): boolean {
  return UUID_REGEX.test(id);
}

type JoinState = {
  client: StreamVideoClient;
  call?: Call;
  userId: string;
  token: string;
  apiKey: string;
  userName: string;
} | null;

export default function CallIdPage() {
  const params = useParams();
  const router = useRouter();
  const callId = typeof params.callId === "string" ? params.callId : "";

  const [joinState, setJoinState] = useState<JoinState>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isCreator = useMemo(() => {
    if (typeof window === "undefined" || !callId) return false;
    return sessionStorage.getItem(CREATOR_KEY_PREFIX + callId) === "1";
  }, [callId]);

  const clearCreatorFlag = useCallback(() => {
    if (callId && typeof window !== "undefined") {
      sessionStorage.removeItem(CREATOR_KEY_PREFIX + callId);
    }
  }, [callId]);

  useEffect(() => {
    if (!callId || !isValidCallId(callId)) {
      router.replace("/");
      return;
    }
  }, [callId, router]);

  if (!callId || !isValidCallId(callId)) {
    return null;
  }

  if (joinState?.call) {
    return (
      <CallView
        client={joinState.client}
        call={joinState.call}
        onLeave={() => setJoinState(null)}
        chatToken={joinState.token}
        chatApiKey={joinState.apiKey}
        userName={joinState.userName}
        userId={joinState.userId}
        inviteLink={typeof window !== "undefined" ? `${window.location.origin}/${callId}` : undefined}
      />
    );
  }

  if (joinState) {
    return (
      <JoinCall
        client={joinState.client}
        userId={joinState.userId}
        onReady={(call) => setJoinState((prev) => (prev ? { ...prev, call } : null))}
        onError={(message) => {
          setJoinError(message);
          setJoinState(null);
        }}
        onCancel={() => setJoinState(null)}
        callId={callId}
        isCreator={isCreator}
        onCreatorSessionStarted={clearCreatorFlag}
      />
    );
  }

  if (joinError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-sm text-destructive">{joinError}</p>
        <Button variant="link" onClick={() => setJoinError(null)}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <Lobby
      onJoined={setJoinState}
      callId={callId}
    />
  );
}
