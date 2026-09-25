import { NextRequest, NextResponse } from 'next/server';
import { generateDevelopmentRecommendation } from '@/lib/recommendationService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { locationKey, bypassCache } = body || {};

    if (!locationKey || typeof locationKey !== 'string' || !locationKey.trim()) {
      return NextResponse.json(
        { error: 'locationKey is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const recommendation = await generateDevelopmentRecommendation(locationKey.trim(), {
      bypassCache: Boolean(bypassCache),
    });

    return NextResponse.json(recommendation, { status: 200 });
  } catch (error: any) {
    console.error('[Recommendation API Error]:', error);

    const status = typeof error?.status === 'number' ? error.status : 500;
    const message = error?.message || 'Failed to generate AI development recommendation.';

    return NextResponse.json(
      {
        error: message,
        status,
      },
      { status }
    );
  }
}
