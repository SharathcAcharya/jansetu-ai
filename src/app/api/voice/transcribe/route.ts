import { NextRequest, NextResponse } from 'next/server';
import { transcribeCitizenAudio } from '@/lib/voiceService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { audioBase64, mimeType, sampleKey } = body || {};

    if (!audioBase64 && !sampleKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either "audioBase64" or "sampleKey" is required to transcribe audio.',
        },
        { status: 400 }
      );
    }

    const result = await transcribeCitizenAudio({
      audioBase64,
      mimeType,
      sampleKey,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Voice Transcribe API Error]:', error?.message || error);

    const status = typeof error?.status === 'number' ? error.status : 500;
    const message = error?.message || 'Failed to process voice transcription.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}
