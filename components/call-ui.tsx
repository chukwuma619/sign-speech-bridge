"use client";

import { useEffect, useState } from "react";
import {
  CallControls,
  CallParticipantsList,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import type { Call, StreamVideoClient } from "@stream-io/video-react-sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiveCaptions } from "@/components/live-captions";

type CallViewProps = {
  client: StreamVideoClient;
  call: Call;
  onLeave: () => void;
  /** Optional: for live captions (Speech → Sign) via Stream Chat */
  chatToken?: string;
  chatApiKey?: string;
  userName?: string;
  userId?: string;
  /** When set, show a button to copy the invite link. */
  inviteLink?: string;
};

function StaticCaptionsPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live captions</CardTitle>
        <CardDescription>
          Speech from other participants will appear here.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm italic text-muted-foreground">Waiting for speech…</p>
      </CardContent>
    </Card>
  );
}

function CallContent({
  call,
  client,
  onLeave,
  chatToken,
  chatApiKey,
  userName,
  userId,
  inviteLink,
}: {
  call: Call;
  client: StreamVideoClient;
  onLeave: () => void;
  chatToken?: string;
  chatApiKey?: string;
  userName?: string;
  userId?: string;
  inviteLink?: string;
}) {
  const { useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
  const participants = useParticipants();
  const { microphone, isMute: micMute } = useMicrophoneState();
  const { camera, isMute: camMute } = useCameraState();
  const [linkCopied, setLinkCopied] = useState(false);
  const [participantsPanelOpen, setParticipantsPanelOpen] = useState(false);

  useEffect(() => {
    camera.enable().catch(console.error);
  }, [camera]);

  const hasChat = Boolean(chatToken && chatApiKey && userId && userName && call.id);

  async function handleCopyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function handleLeave() {
    await call.leave().catch(console.error);
    await client.disconnectUser().catch(console.error);
    onLeave();
  }

  return (
    <div className="flex h-screen flex-col gap-4 bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Sispe</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setParticipantsPanelOpen(true)}
          >
            People ({participants.length})
          </Button>
          {inviteLink && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyInviteLink}
            >
              {linkCopied ? "Link copied" : "Copy link"}
            </Button>
          )}
          <Button type="button" variant="destructive" size="sm" onClick={handleLeave}>
            Leave
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 md:flex-row">
        <div className="min-h-0 flex-1">
          <StreamTheme>
            <SpeakerLayout participantsBarPosition="bottom" />
          </StreamTheme>

        </div>
        <aside className="w-full shrink-0 space-y-2 md:w-72">
          {hasChat ? (
            <LiveCaptions
              callId={call.id}
              apiKey={chatApiKey!}
              token={chatToken!}
              userId={userId!}
              userName={userName!}
            />
          ) : (
            <StaticCaptionsPanel />
          )}
          <p className="text-xs text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? "s" : ""} in call
          </p>
        </aside>
      </div>
      <StreamTheme>
        <CallControls />
      </StreamTheme>

      {/* Meet-style participants panel (People) */}
      {participantsPanelOpen && (
        <div className="fixed inset-0 z-50 md:inset-y-0 md:left-auto md:right-0 md:w-[380px]">
          <div
            className="absolute inset-0 bg-black/50 md:bg-transparent"
            aria-hidden
            onClick={() => setParticipantsPanelOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-full border-l bg-background shadow-lg md:w-[380px]">
            <StreamTheme>
              <CallParticipantsList onClose={() => setParticipantsPanelOpen(false)} />
            </StreamTheme>
          </aside>
        </div>
      )}
    </div>
  );
}

export function CallView({
  client,
  call,
  onLeave,
  chatToken,
  chatApiKey,
  userName,
  userId,
  inviteLink,
}: CallViewProps) {
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallContent
          call={call}
          client={client}
          onLeave={onLeave}
          chatToken={chatToken}
          chatApiKey={chatApiKey}
          userName={userName}
          userId={userId}
          inviteLink={inviteLink}
        />
      </StreamCall>
    </StreamVideo>
  );
}
