"use client";

import { useEffect } from "react";
import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CallViewProps = {
  client: StreamVideoClient;
  call: Call;
  onLeave: () => void;
};

function CaptionsPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live captions</CardTitle>
        <CardDescription>
          Speech from other participants will appear here.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm italic text-muted-foreground">
          Waiting for speech…
        </p>
      </CardContent>
    </Card>
  );
}

function CallContent({
  call,
  client,
  onLeave,
}: {
  call: Call;
  client: StreamVideoClient;
  onLeave: () => void;
}) {
  const { useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
  const participants = useParticipants();
  const { microphone, isMute: micMute } = useMicrophoneState();
  const { camera, isMute: camMute } = useCameraState();

  useEffect(() => {
    camera.enable().catch(console.error);
  }, [camera]);

  async function handleLeave() {
    await call.leave().catch(console.error);
    await client.disconnectUser().catch(console.error);
    onLeave();
  }

  return (
    <div className="flex h-screen flex-col gap-4 bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Sign–Speech Bridge</h2>
        <Button type="button" variant="destructive" size="sm" onClick={handleLeave}>
          Leave call
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-4 md:flex-row">
        <div className="min-h-0 flex-1">
          <StreamTheme>
            <SpeakerLayout participantsBarPosition="bottom" />
          </StreamTheme>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => camera.toggle()}
            >
              {camMute ? "Turn on camera" : "Turn off camera"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => microphone.toggle()}
            >
              {micMute ? "Turn on microphone" : "Turn off microphone"}
            </Button>
          </div>
        </div>
        <aside className="w-full shrink-0 space-y-2 md:w-72">
          <CaptionsPanel />
          <p className="text-xs text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? "s" : ""} in call
          </p>
        </aside>
      </div>
      <StreamTheme>
        <CallControls />
      </StreamTheme>
    </div>
  );
}

export function CallView({ client, call, onLeave }: CallViewProps) {
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallContent call={call} client={client} onLeave={onLeave} />
      </StreamCall>
    </StreamVideo>
  );
}
