import { NextRequest, NextResponse } from "next/server";

// Cache in memory to avoid burning requests on every page refresh
let cachedRateLimit: {
  limit: number;
  remaining: number;
  percentage: number;
  reset: string;
  provider: string;
  timestamp: number;
} | null = null;

export function updateCachedRateLimit(limit: number, remaining: number, reset: string, provider: string) {
  const percentage = limit > 0 ? Math.round((remaining / limit) * 1000) / 10 : 100;
  cachedRateLimit = {
    limit,
    remaining,
    percentage,
    reset,
    provider,
    timestamp: Date.now(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json({
        success: false,
        error: "No GROQ_API_KEY configured",
      });
    }

    // Return cache if it was updated in the last 45 seconds
    if (cachedRateLimit && Date.now() - cachedRateLimit.timestamp < 45000) {
      return NextResponse.json({
        success: true,
        ...cachedRateLimit,
      });
    }

    // Generate a tiny 0.05s valid silence WAV buffer to fetch live rate limit headers
    const sampleRate = 8000;
    const numSamples = 400; // 0.05s
    const buffer = Buffer.alloc(44 + numSamples * 2);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    const blob = new Blob([buffer], { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", blob, "ping.wav");
    formData.append("model", "whisper-large-v3");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
    });

    const limitHeader = response.headers.get("x-ratelimit-limit-requests");
    const remainingHeader = response.headers.get("x-ratelimit-remaining-requests");
    const resetHeader = response.headers.get("x-ratelimit-reset-requests");

    const limit = limitHeader ? parseInt(limitHeader, 10) : 2000;
    const remaining = remainingHeader ? parseInt(remainingHeader, 10) : 2000;
    const reset = resetHeader || "daily";

    updateCachedRateLimit(limit, remaining, reset, "Groq Whisper");

    return NextResponse.json({
      success: true,
      ...cachedRateLimit,
    });
  } catch (err: unknown) {
    const error = err as Error;
    // If request fails, return cached if exists, or reasonable default
    if (cachedRateLimit) {
      return NextResponse.json({
        success: true,
        ...cachedRateLimit,
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch rate limit",
    });
  }
}
