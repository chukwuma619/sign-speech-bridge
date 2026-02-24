import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const JWT_HEADER = Buffer.from(
  JSON.stringify({ alg: "HS256", typ: "JWT" })
).toString("base64url");
const VALIDITY_SECONDS = 60 * 60; // 1 hour

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const message = `${JWT_HEADER}.${payloadB64}`;
  const signature = createHmac("sha256", secret)
    .update(message)
    .digest("base64url");
  return `${message}.${signature}`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.STREAM_API_SECRET;
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const userId = request.nextUrl.searchParams.get("userId") ?? "anonymous";

  if (!secret || !apiKey) {
    return NextResponse.json(
      { error: "Stream API key or secret not configured" },
      { status: 500 }
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userId,
    iat: now,
    exp: now + VALIDITY_SECONDS,
  };

  const token = signJwt(payload, secret);
  return NextResponse.json({ token, apiKey, userId });
}
