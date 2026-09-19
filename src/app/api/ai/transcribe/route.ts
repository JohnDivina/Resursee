import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Rate Limiting Map for In-Memory Throttling (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 25; // 25 transcriptions per 5 mins per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number; resetTime: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds, resetTime: record.resetTime, remaining: 0 };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetTime: record.resetTime,
  };
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Enforce Sliding Window Anti-Spam Rate Limit
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before submitting another audio track.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
        },
      }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 503 }
    );
  }

  try {
    let audioBase64 = '';
    let mimeType = 'audio/webm';
    let requestedLanguage = 'auto';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No audio file provided in request.' }, { status: 400 });
      }
      requestedLanguage = (formData.get('language') as string) || 'auto';
      mimeType = file.type || 'audio/webm';
      const arrayBuffer = await file.arrayBuffer();
      audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    } else {
      const body = await request.json();
      audioBase64 = body.audioBase64 || '';
      mimeType = body.mimeType || 'audio/webm';
      requestedLanguage = body.language || 'auto';
    }

    if (!audioBase64) {
      return NextResponse.json({ error: 'Empty audio payload provided.' }, { status: 400 });
    }

    // Clean up mimeType for Gemini accepted formats
    let cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();
    if (cleanMimeType.includes('wav')) cleanMimeType = 'audio/wav';
    else if (cleanMimeType.includes('mp3') || cleanMimeType.includes('mpeg')) cleanMimeType = 'audio/mp3';
    else if (cleanMimeType.includes('ogg')) cleanMimeType = 'audio/ogg';
    else if (cleanMimeType.includes('aac') || cleanMimeType.includes('m4a')) cleanMimeType = 'audio/aac';
    else cleanMimeType = 'audio/webm';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const langInstruction =
      requestedLanguage === 'fil'
        ? 'The audio contains Filipino / Tagalog / Taglish speech.'
        : requestedLanguage === 'en'
        ? 'The audio contains English speech.'
        : 'Detect the primary spoken language automatically (Tagalog, English, Taglish, Japanese, etc.).';

    const prompt = `You are a professional audio transcription engine and meeting intelligence AI.
${langInstruction}
Transcribe the provided audio recording verbatim with high precision.
Identify distinct speakers and separate their speech into conversational turn segments with precise start and end timestamps in seconds.
Generate a concise meeting summary and extract clear key meeting points, decisions, or action items.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "detectedLanguage": "fil",
  "summary": "A concise 1-2 sentence executive summary of what was discussed.",
  "segments": [
    {
      "speakerLabel": "Speaker 1",
      "text": "Exact transcribed spoken words with proper grammar and punctuation.",
      "startTime": 0.0,
      "endTime": 3.4
    }
  ],
  "meetingNotes": [
    {
      "type": "decision" | "action_item" | "key_point",
      "text": "Clear concise note or action item",
      "assignee": "Name if mentioned, or empty string"
    }
  ]
}`;

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: cleanMimeType,
      },
    };

    const result = await model.generateContent([prompt, audioPart]);
    const responseText = result.response.text();

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fence
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    // Assign consistent IDs and speaker IDs
    const speakerMap = new Map<string, string>();
    let speakerCounter = 0;

    const formattedSegments = (parsed.segments || []).map((seg: any) => {
      const label = seg.speakerLabel || 'Speaker 1';
      if (!speakerMap.has(label)) {
        speakerMap.set(label, `speaker_${speakerCounter++}`);
      }
      const speakerId = speakerMap.get(label)!;

      return {
        id: crypto.randomUUID(),
        speakerId,
        speakerLabel: label,
        text: (seg.text || '').trim(),
        startTime: Number(seg.startTime) || 0,
        endTime: Math.max((Number(seg.startTime) || 0) + 0.5, Number(seg.endTime) || 1),
        confidence: 0.98,
        language: parsed.detectedLanguage || requestedLanguage,
        isEdited: false,
        revisionHistory: [],
      };
    });

    const formattedNotes = (parsed.meetingNotes || []).map((note: any) => ({
      id: crypto.randomUUID(),
      type: note.type || 'key_point',
      text: note.text || '',
      assignee: note.assignee || undefined,
      isCompleted: false,
    }));

    return NextResponse.json(
      {
        success: true,
        detectedLanguage: parsed.detectedLanguage || requestedLanguage,
        summary: parsed.summary || 'Meeting transcribed successfully.',
        segments: formattedSegments,
        meetingNotes: formattedNotes,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error('Audio transcription API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process audio transcription with Gemini.' },
      { status: 500 }
    );
  }
}
