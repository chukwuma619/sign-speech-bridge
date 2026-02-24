"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  Link2,
  Menu,
  Plus,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const CREATOR_KEY_PREFIX = "sign-speech-bridge-creator-";

function formatTime(d: Date) {
  const day = d.toLocaleDateString("en-GB", { weekday: "short" });
  const date = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  const t = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${t} • ${day} ${date} ${month}`;
}

function TimeDisplay() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(formatTime(new Date()));
    const t = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);
  return <span>{time || "\u00A0"}</span>;
}

export default function Home() {
  const router = useRouter();
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  function startInstantMeeting() {
    const callId = crypto.randomUUID();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CREATOR_KEY_PREFIX + callId, "1");
    }
    router.push(`/${callId}`);
  }

  function getLinkToShare() {
    const callId = crypto.randomUUID();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CREATOR_KEY_PREFIX + callId, "1");
      const link = `${window.location.origin}/${callId}`;
      navigator.clipboard.writeText(link).then(() => {
        setInviteUrl(link);
        setInviteError(null);
      });
    }
  }

  function handleJoinWithLink(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    const trimmed = inviteUrl.trim();
    if (!trimmed) {
      setInviteError("Paste a link to join");
      return;
    }
    let path: string;
    if (trimmed.startsWith("/")) {
      path = trimmed.replace(/\/$/, "");
    } else {
      try {
        path = new URL(trimmed).pathname.replace(/\/$/, "");
      } catch {
        setInviteError("Invalid link");
        return;
      }
    }
    const callId = path.split("/").filter(Boolean).pop();
    if (callId && /^[0-9a-f-]{36}$/i.test(callId)) {
      router.push(`/${callId}`);
      return;
    }
    setInviteError("Invalid link. Use the full URL or path (e.g. /call-id).");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-2">
          <Video className="size-5" />
            <span className="text-lg font-medium text-foreground">
              Sispe
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TimeDisplay />
        </div>
      </header>

      <div className="flex flex-1">
  

        {/* Main / Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl space-y-8 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Video calls and meetings for everyone
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Connect, collaborate and celebrate from anywhere with
                Sispe. Sign language and speech in one call.
              </p>
            </div>

            {/* Action row: New meeting dropdown | Enter code/link | Join */}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    className="min-w-[140px] gap-2 sm:min-w-[160px]"
                  >
                    <Plus className="size-5 shrink-0" />
                    New meeting
                    <ChevronDown className="size-4 shrink-0 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={startInstantMeeting}>
                    <Plus className="size-4" />
                    Start an instant meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={getLinkToShare}>
                    <Link2 className="size-4" />
                    Get a link to share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <form
                onSubmit={handleJoinWithLink}
                className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
              >
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Enter a code or link"
                    value={inviteUrl}
                    onChange={(e) => {
                      setInviteUrl(e.target.value);
                      setInviteError(null);
                    }}
                    className="h-11 border-border bg-muted/30 pr-3 font-mono text-sm placeholder:text-muted-foreground"
                    aria-invalid={!!inviteError}
                    aria-describedby={inviteError ? "join-error" : undefined}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="h-11 shrink-0 px-6"
                >
                  Join
                </Button>
              </form>
            </div>

            {inviteError && (
              <p
                id="join-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {inviteError}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
