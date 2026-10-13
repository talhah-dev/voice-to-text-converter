import { NextRequest, NextResponse } from "next/server";

// Helper to check if text contains Hindi Devanagari characters
function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "english"; // 'english', 'urdu', or 'original'
    const customApiKey = (formData.get("apiKey") as string)?.trim();
    const preferredProvider = (formData.get("provider") as string)?.trim();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Determine API Key and Provider
    const groqKey = customApiKey?.startsWith("gsk_")
      ? customApiKey
      : preferredProvider === "groq" && customApiKey
      ? customApiKey
      : process.env.GROQ_API_KEY;

    const openAiKey = customApiKey?.startsWith("sk-")
      ? customApiKey
      : preferredProvider === "openai" && customApiKey
      ? customApiKey
      : process.env.OPENAI_API_KEY;

    const geminiKey = customApiKey?.startsWith("AIza")
      ? customApiKey
      : preferredProvider === "gemini" && customApiKey
      ? customApiKey
      : process.env.GEMINI_API_KEY;

    const activeGroqKey = customApiKey && preferredProvider === "groq" ? customApiKey : groqKey;
    const activeOpenAiKey = customApiKey && preferredProvider === "openai" ? customApiKey : openAiKey;
    const activeGeminiKey = customApiKey && preferredProvider === "gemini" ? customApiKey : geminiKey;

    // 1. Try Groq (Whisper-large-v3) - ultra fast & free tier
    if (activeGroqKey) {
      try {
        const isEnglish = mode === "english";
        const isUrdu = mode === "urdu";

        const endpoint = isEnglish
          ? "https://api.groq.com/openai/v1/audio/translations"
          : "https://api.groq.com/openai/v1/audio/transcriptions";

        const buildGroqForm = (forceUrdu: boolean = false) => {
          const form = new FormData();
          form.append("file", file);
          form.append("model", "whisper-large-v3");
          form.append("response_format", "verbose_json");

          if (!isEnglish) {
            if (isUrdu || forceUrdu) {
              // Explicitly force Urdu language code and prompt so Whisper writes in Urdu script, never Hindi
              form.append("language", "ur");
              form.append("prompt", "یہ ایک اردو صوتی پیغام ہے۔ برائے مہربانی اسے اردو رسم الخط میں لکھیں۔");
            } else {
              // For generic original mode, bias against Hindi Devanagari for Urdu/Hindi audio
              form.append("prompt", "اگر یہ آڈیو اردو یا ہندی میں ہے، تو برائے مہربانی اسے اردو رسم الخط میں لکھیں۔");
            }
          }
          return form;
        };

        let response = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${activeGroqKey}` },
          body: buildGroqForm(),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `Groq API responded with status ${response.status}`
          );
        }

        let data = await response.json();
        let text = data.text?.trim() || "";
        let detectedLanguage = data.language || (isEnglish ? "English" : isUrdu ? "Urdu" : "Original");

        // CRITICAL: If Whisper misidentified Urdu as Hindi (or produced Devanagari script), automatically re-run with language="ur"
        if (!isEnglish && (data.language === "hi" || data.language === "hindi" || hasDevanagari(text))) {
          console.log("Whisper produced Hindi script for audio. Re-transcribing strictly in Urdu script...");
          const retryResponse = await fetch(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${activeGroqKey}` },
            body: buildGroqForm(true),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            text = retryData.text?.trim() || text;
            detectedLanguage = "Urdu (اردو)";
          }
        }

        const limitHeader = response.headers.get("x-ratelimit-limit-requests");
        const remainingHeader = response.headers.get("x-ratelimit-remaining-requests");
        const resetHeader = response.headers.get("x-ratelimit-reset-requests");

        const rateLimit =
          limitHeader && remainingHeader
            ? {
                limit: parseInt(limitHeader, 10),
                remaining: parseInt(remainingHeader, 10),
                percentage:
                  Math.round(
                    (parseInt(remainingHeader, 10) / parseInt(limitHeader, 10)) * 1000
                  ) / 10,
                reset: resetHeader || "daily",
                provider: "Groq Whisper",
              }
            : undefined;

        return NextResponse.json({
          success: true,
          transcription: text,
          detectedLanguage: detectedLanguage === "ur" ? "Urdu (اردو)" : detectedLanguage,
          provider: "Groq Whisper Large v3",
          rateLimit,
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Groq Whisper error:", error);
        if (preferredProvider === "groq") {
          return NextResponse.json(
            { success: false, error: `Groq Whisper Error: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    // 2. Try OpenAI Whisper (whisper-1)
    if (activeOpenAiKey) {
      try {
        const isEnglish = mode === "english";
        const isUrdu = mode === "urdu";

        const endpoint = isEnglish
          ? "https://api.openai.com/v1/audio/translations"
          : "https://api.openai.com/v1/audio/transcriptions";

        const buildOpenAiForm = (forceUrdu: boolean = false) => {
          const form = new FormData();
          form.append("file", file);
          form.append("model", "whisper-1");
          form.append("response_format", "verbose_json");

          if (!isEnglish) {
            if (isUrdu || forceUrdu) {
              form.append("language", "ur");
              form.append("prompt", "یہ ایک اردو صوتی پیغام ہے۔ برائے مہربانی اسے اردو رسم الخط میں لکھیں۔");
            } else {
              form.append("prompt", "اگر یہ گفتگو اردو یا ہندی میں ہو، تو اسے اردو رسم الخط میں تحریر کریں۔");
            }
          }
          return form;
        };

        let response = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${activeOpenAiKey}` },
          body: buildOpenAiForm(),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `OpenAI API responded with status ${response.status}`
          );
        }

        let data = await response.json();
        let text = data.text?.trim() || "";
        let detectedLanguage = data.language || (isEnglish ? "English" : isUrdu ? "Urdu" : "Original");

        // Re-run if Devanagari Hindi was generated
        if (!isEnglish && (data.language === "hi" || data.language === "hindi" || hasDevanagari(text))) {
          console.log("OpenAI Whisper produced Hindi. Re-transcribing in Urdu script...");
          const retryResponse = await fetch(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${activeOpenAiKey}` },
            body: buildOpenAiForm(true),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            text = retryData.text?.trim() || text;
            detectedLanguage = "Urdu (اردو)";
          }
        }

        return NextResponse.json({
          success: true,
          transcription: text,
          detectedLanguage: detectedLanguage === "ur" ? "Urdu (اردو)" : detectedLanguage,
          provider: "OpenAI Whisper",
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.error("OpenAI Whisper error:", error);
        if (preferredProvider === "openai") {
          return NextResponse.json(
            { success: false, error: `OpenAI Error: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    // 3. Try Gemini Multimodal Audio
    if (activeGeminiKey) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "audio/mp3";

        let prompt = "";
        if (mode === "english") {
          prompt =
            "Transcribe the speech in this audio and translate it into clear English. Output ONLY the translated English text, without commentary, timestamps, or markdown quotation marks.";
        } else if (mode === "urdu") {
          prompt =
            "Transcribe the speech in this audio verbatim into standard Urdu script (اردو رسم الخط / Nastaliq). ABSOLUTE REQUIREMENT: Do NOT write in Hindi or Devanagari script. Output ONLY the Urdu script text, without commentary, timestamps, or markdown quotation marks.";
        } else {
          prompt =
            "Transcribe the speech in this audio verbatim in its original spoken language. IMPORTANT: If the speech is Urdu or Hindi, you MUST transcribe it in authentic Urdu script (اردو رسم الخط), NOT in Hindi Devanagari script. Output ONLY the transcribed text without commentary.";
        }

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeGeminiKey}`;

        const response = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `Gemini API responded with status ${response.status}`
          );
        }

        const data = await response.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        return NextResponse.json({
          success: true,
          transcription: text,
          detectedLanguage:
            mode === "english"
              ? "English (Translated)"
              : mode === "urdu"
              ? "Urdu (اردو)"
              : "Original Language",
          provider: "Gemini 1.5 Flash Audio",
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Gemini Audio error:", error);
        if (preferredProvider === "gemini") {
          return NextResponse.json(
            { success: false, error: `Gemini Error: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    // 4. Simulated demo fallback when no API key is set
    let sampleTextByMode = "";
    if (mode === "english") {
      sampleTextByMode = `[English Translation]: Hello, thank you for listening. This voice message was successfully received and converted into English. The audio file "${file.name}" has been transcribed accurately.`;
    } else if (mode === "urdu") {
      sampleTextByMode = `[اردو رسم الخط]: السلام علیکم، یہ ایک صوتی پیغام ہے جو کامیابی سے موصول ہوا اور اردو رسم الخط میں تحریر کیا گیا ہے۔ صوتی فائل "${file.name}" کی ٹرانسکرپشن کامیابی سے مکمل ہو چکی ہے۔`;
    } else {
      sampleTextByMode = `[Original / اردو]: السلام علیکم، آپ کی آڈیو فائل "${file.name}" موصول ہو چکی ہے اور اسے اردو رسم الخط میں لکھ دیا گیا ہے۔`;
    }

    return NextResponse.json({
      success: true,
      isDemo: true,
      transcription: sampleTextByMode,
      detectedLanguage:
        mode === "english"
          ? "English (Demo)"
          : mode === "urdu"
          ? "Urdu (اردو Demo)"
          : "Original (Demo)",
      provider: "Demo Engine (Add your Groq or OpenAI API key in Settings for Live Whisper AI)",
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process audio file" },
      { status: 500 }
    );
  }
}
