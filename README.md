# Sign-Speech Bridge

Real-time sign language ↔ speech bridge using Vision Agents and Stream Video. See [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md) for architecture and phases.

This repo contains a **Next.js** frontend (Phase 2) and a **Vision Agents Python** backend in `agent/` (Phase 1).

## Running the agent (Phase 1)

The agent runs as a separate Python service. Use [uv](https://docs.astral.sh/uv/) (recommended) or pip.

1. **Install uv** (if needed): `curl -LsSf https://astral.sh/uv/install.sh | sh`

2. **Go to the agent directory and install dependencies:**
   ```bash
   cd agent
   uv sync
   ```
   The project uses **Python 3.10–3.13** so that the `av` (PyAV) dependency installs from a pre-built wheel. If you previously used Python 3.14 or see errors building `av`, switch to 3.12 and re-sync:
   ```bash
   uv python install 3.12
   rm -rf .venv uv.lock
   uv sync
   ```
   If `uv sync` still fails building `av` (PyAV) with an error about ffmpeg or pkg-config, install the system dependencies first, then run `uv sync` again:
   - **macOS (Homebrew):** `brew install ffmpeg pkg-config`
   - **Linux (apt):** `sudo apt-get install ffmpeg pkg-config libavformat-dev libavcodec-dev libavdevice-dev libavutil-dev libswscale-dev libswresample-dev`
   PyAV 14 requires **ffmpeg 7** when building from source; if your package manager has an older ffmpeg, see [PyAV installation](https://pyav.org/docs/stable/overview/installation.html).

3. **Configure environment:** Copy `.env.example` to `.env` and set your API keys (Stream, Google, Deepgram). See `agent/.env.example` for variable names.

4. **Run the agent:**
   - **Console (single call):** `uv run main.py run`
   - **HTTP server (for frontend):** `uv run main.py serve --host 0.0.0.0 --port 8000`
     - Health: `GET http://localhost:8000/health` and `GET http://localhost:8000/ready`
     - Create session: `POST http://localhost:8000/sessions` with body `{"call_type": "default", "call_id": "<your-call-id>"}`

   **Without uv:** Create a venv, then `pip install -r requirements.txt` (see `agent/requirements.txt`). Some dependencies may require system libraries (e.g. ffmpeg).

## Running the frontend (Phase 2)

The Next.js app uses the [Stream Video React SDK](https://getstream.io/video/docs/react/) to join calls where the Phase 1 agent is a participant.

1. **Environment:** Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_STREAM_API_KEY` — same Stream API key as the agent
   - `STREAM_API_SECRET` — same Stream API secret (used server-side for token generation)
   - `NEXT_PUBLIC_AGENT_SERVER_URL` — base URL of the agent HTTP server (e.g. `http://localhost:8000`)

2. **Start the agent server** (see Phase 1) so it is running at `NEXT_PUBLIC_AGENT_SERVER_URL`.

3. **Run the Next.js dev server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000), enter a name (optional), and click **Join call**. The app will create a Stream call, spawn the agent into that call, and show the call UI with local video (for signing), participants (you + agent), **live captions** (Speech → Sign: agent and participant speech shown in the sidebar), and camera/mic controls.

## Phase 3 / Polish (optional)

- **HeyGen (signed avatar):** Optional [HeyGen](https://www.heygen.com/) (or similar) plugin can be added to Vision Agents for signed output so signers “see” spoken replies in sign. See [Vision Agents integrations](https://visionagents.ai/integrations/introduction-to-integrations).
- **RAG (sign vocabulary):** Optional RAG (e.g. [TurboPuffer](https://turbopuffer.com/)) over sign vocabulary or FAQ can improve interpretation; plug into the agent’s context or tools.
- **Low-latency tuning:** Adjust agent `fps` (e.g. in `agent/main.py`, Gemini Realtime `fps=3`), turn-detection settings, and Stream call settings so the bridge feels real-time. See Stream’s [transcription and captions](https://getstream.io/video/docs/react/transcribing/calls/) and your agent’s STT/TTS configuration.

## Getting Started (Next.js)

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
