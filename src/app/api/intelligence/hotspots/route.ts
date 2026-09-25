import { NextResponse } from 'next/server';
import { getDemandHotspots } from '@/lib/demandIntelligenceService';
import { isFirebaseConfigured } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        {
          error:
            'Firebase credentials are not configured on the server. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.',
          hotspots: [],
          totalRequests: 0,
          geographicallyMappedRequests: 0,
          unmappedRequests: 0,
        },
        { status: 503 }
      );
    }

    const result = await getDemandHotspots();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/intelligence/hotspots Error]:', error?.message || error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to aggregate demand hotspots from Firestore.',
        hotspots: [],
        totalRequests: 0,
        geographicallyMappedRequests: 0,
        unmappedRequests: 0,
      },
      { status: 500 }
    );
  }
}
