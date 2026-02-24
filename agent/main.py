"""
Sign-Speech Bridge Agent — Vision Agents backend.

Agent with GetStream Edge, YOLO pose/hand processor, Gemini Realtime, and Deepgram STT.
Run: uv run main.py run  (console) | uv run main.py serve  (HTTP server).
"""

import logging

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, ServeOptions, User
from vision_agents.plugins import deepgram, gemini, getstream, ultralytics

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_agent(**kwargs) -> Agent:
    """Create and configure the Sign-Speech Bridge agent."""
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Sign-Speech Bridge", id="agent"),
        instructions="Read @instructions.md",
        llm=gemini.Realtime(fps=3),
        processors=[
            ultralytics.YOLOPoseProcessor(
                model_path="yolo11n-pose.pt",
                enable_hand_tracking=True,
                conf_threshold=0.5,
            )
        ],
        stt=deepgram.STT(eager_turn_detection=True),
    )
    return agent


async def join_call(
    agent: Agent, call_type: str, call_id: str, **kwargs
) -> None:
    """Join a call and run the agent until the call ends."""
    await agent.create_user()
    call = await agent.create_call(call_type, call_id)

    async with agent.join(call):
        await agent.llm.simple_response(
            "Say a brief greeting. You are a sign-language bridge: interpret sign from the video and speak the meaning; when you hear speech, acknowledge it so the signer can see the reply."
        )
        await agent.finish()


def get_runner() -> Runner:
    """Build Runner with optional CORS for the Next.js frontend."""
    launcher = AgentLauncher(
        create_agent=create_agent,
        join_call=join_call,
    )
    serve_options = ServeOptions(
        cors_allow_origins=["http://localhost:3000"],
    )
    return Runner(launcher, serve_options=serve_options)


if __name__ == "__main__":
    get_runner().cli()
