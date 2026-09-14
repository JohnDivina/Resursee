import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySignedSession } from '@/lib/sessionCrypto';
import { checkUserQuota, incrementUserQuota } from '@/lib/quotaManager';
import { TranscriptSegment, MeetingNoteItem } from '@/types/transcriber';
import crypto from 'crypto';

// Rate Limiting Map for In-Memory Throttling (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 15; // 15 cloud transcriptions per 5 mins per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ready', service: 'ai-transcriber' });
}

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Enforce Sliding Window Anti-Spam Rate Limit
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before initiating another cloud transcription.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          },
        }
      );
    }

    // 2. Read Authenticated Session & Verify Daily Quota
    const cookieStore = await cookies();
    const token = cookieStore.get('resursee_admin_token')?.value;
    const guestCookie = cookieStore.get('resursee_guest_quota')?.value;
    const session = token ? verifySignedSession(token) : null;

    const quota = checkUserQuota(session, clientIp, guestCookie);

    const body = await request.json();
    const {
      audioBase64,
      mimeType = 'audio/wav',
      language = 'auto',
      action = 'transcribe', // 'transcribe' | 'notes'
      segments: inputSegments,
    } = body;

    // Check quota for cloud transcription requests
    if (action === 'transcribe' && audioBase64 && !quota.allowed) {
      if (quota.isGuest) {
        return NextResponse.json(
          {
            error:
              'You have reached your free guest preview quota. Please sign in to unlock daily AI cloud transcription!',
            isGuestQuotaExceeded: true,
            quota,
          },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          {
            error: `You have reached your daily quota of ${quota.maxQuota} AI cloud operations. Your quota resets at midnight UTC.`,
            quota,
          },
          { status: 429 }
        );
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error:
            'Gemini API Key is not configured on the server. Please check environment variables or use the Browser/Local tier.',
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.trim());

    // ACTION: GENERATE STRUCTURED MEETING NOTES FROM EXISTING TRANSCRIPT
    if (action === 'notes') {
      if (!inputSegments || !Array.isArray(inputSegments) || inputSegments.length === 0) {
        return NextResponse.json(
          { error: 'No transcript segments provided to summarize.' },
          { status: 400 }
        );
      }

      const formattedTranscript = inputSegments
        .map((s: TranscriptSegment) => `[${s.startTime.toFixed(1)}s] ${s.speakerLabel}: ${s.text}`)
        .join('\n');

      const notesPrompt = `You are an elite executive secretary and meeting intelligence analyst.
Analyze the following meeting transcript (which may contain English, Tagalog, or Taglish code-switching).
Extract structured meeting intelligence.

Transcript:
${formattedTranscript}

Return strictly a valid JSON object matching this schema:
{
  "summary": "Concise 2 to 3 sentence executive summary of the meeting context and major discussions.",
  "meetingNotes": [
    {
      "category": "key_point" | "decision" | "action_item" | "question" | "follow_up",
      "content": "Specific bullet description",
      "timestamp": number (seconds into the meeting where this occurred),
      "assignee": "Name of person responsible if mentioned, or null"
    }
  ]
}
Include at least 2-4 key points, any explicit decisions, all action items (with assignees if found), and unresolved questions. Return ONLY valid JSON without markdown wrapping.`;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(notesPrompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      const meetingNotes: MeetingNoteItem[] = (parsed.meetingNotes || []).map(
        (item: { category: string; content: string; timestamp: number; assignee?: string }) => ({
          id: crypto.randomUUID(),
          category: item.category as MeetingNoteItem['category'],
          content: item.content,
          timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0,
          assignee: item.assignee || undefined,
          isCompleted: false,
        })
      );

      return NextResponse.json({
        summary: parsed.summary || '',
        meetingNotes,
      });
    }

    // ACTION: TRANSCRIBE AUDIO FILE OR RECORDING
    if (!audioBase64) {
      return NextResponse.json(
        { error: 'Missing audio payload for transcription.' },
        { status: 400 }
      );
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9-+.]+;base64,/, '');

    const languageInstruction =
      language === 'fil'
        ? 'The audio is primarily in Filipino (Tagalog) or Taglish (Tagalog-English code-switching). Accurately transcribe conversational Philippine idioms, colloquialisms, and mixed English-Tagalog sentences.'
        : language === 'auto'
          ? 'Automatically detect the language(s) spoken, including multi-lingual code-switching such as Taglish.'
          : `The primary expected language code is ${language}.`;

    const transcribePrompt = `You are a speech-to-text transcriber and speaker diarization engine.
${languageInstruction}

Analyze this audio file completely. Identify distinct speakers (Speaker 1, Speaker 2, etc.), segment turns with precise timestamps in seconds, and transcribe spoken dialogue verbatim.

Return strictly a valid JSON object matching this schema:
{
  "detectedLanguage": "fil" | "en" | string,
  "summary": "Brief 2-sentence summary of the meeting dialogue.",
  "segments": [
    {
      "speakerId": "speaker_0" | "speaker_1" | string,
      "speakerLabel": "Speaker 1" | "Speaker 2" | string,
      "text": "Transcribed dialogue for this turn",
      "startTime": number (start time in seconds, e.g. 0.0),
      "endTime": number (end time in seconds, e.g. 4.8),
      "confidence": number between 0.80 and 0.99,
      "language": "fil" | "en" | string
    }
  ],
  "meetingNotes": [
    {
      "category": "key_point" | "decision" | "action_item" | "question" | "follow_up",
      "content": "Specific insight or action item",
      "timestamp": number,
      "assignee": "Name if found, else null"
    }
  ]
}
Ensure segments are strictly chronological and non-overlapping. Return ONLY valid JSON without codeblocks or explanations.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const result = await model.generateContent([
      transcribePrompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'audio/wav',
        },
      },
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Track quota increment
    const { quota: updatedQuota, newGuestCookie } = incrementUserQuota(session, clientIp, guestCookie);

    // Format segments with secure UUIDs and revision history
    const segments: TranscriptSegment[] = (parsed.segments || []).map(
      (s: {
        speakerId?: string;
        speakerLabel?: string;
        text?: string;
        startTime?: number;
        endTime?: number;
        confidence?: number;
        language?: string;
      }) => ({
        id: crypto.randomUUID(),
        speakerId: s.speakerId || 'speaker_0',
        speakerLabel: s.speakerLabel || 'Speaker 1',
        text: s.text || '',
        startTime: typeof s.startTime === 'number' ? s.startTime : 0,
        endTime: typeof s.endTime === 'number' ? s.endTime : 0,
        confidence: typeof s.confidence === 'number' ? s.confidence : 0.95,
        language: s.language || parsed.detectedLanguage || 'fil',
        isEdited: false,
        revisionHistory: [],
      })
    );

    const meetingNotes: MeetingNoteItem[] = (parsed.meetingNotes || []).map(
      (item: { category: string; content: string; timestamp: number; assignee?: string }) => ({
        id: crypto.randomUUID(),
        category: item.category as MeetingNoteItem['category'],
        content: item.content,
        timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0,
        assignee: item.assignee || undefined,
        isCompleted: false,
      })
    );

    const res = NextResponse.json({
      detectedLanguage: parsed.detectedLanguage || 'fil',
      summary: parsed.summary || '',
      segments,
      meetingNotes,
    });

    if (newGuestCookie) {
      res.cookies.set('resursee_guest_quota', newGuestCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      });
    }

    return res;
  } catch (err: unknown) {
    console.error('Transcription API error:', err);
    const message = err instanceof Error ? err.message : 'Internal transcription failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
