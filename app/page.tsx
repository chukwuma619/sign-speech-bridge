"use client";

import { useState } from "react";
import { Lobby } from "@/components/lobby";
import { Button } from "@/components/ui/button";
import { JoinCall } from "@/components/join-call";
import { CallView } from "@/components/call-ui";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";

type JoinState = {
  client: StreamVideoClient;
  call?: Call;
  userId: string;
} | null;

export default function Home() {
  const [joinState, setJoinState] = useState<JoinState>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  if (joinState?.call) {
    return (
      <CallView
        client={joinState.client}
        call={joinState.call}
        onLeave={() => setJoinState(null)}
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
      </div>
    );
  }

  return <Lobby onJoined={setJoinState} />;
}
