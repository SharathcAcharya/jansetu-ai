import { NextRequest, NextResponse } from 'next/server';
import { getEvidenceBundle } from '@/lib/evidence/evidenceBundleService';
import { isFirebaseConfigured } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase credentials are not configured on the server.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const locationKey = searchParams.get('locationKey')?.trim();
    const state = searchParams.get('state')?.trim();
    const district = searchParams.get('district')?.trim();
    const locality = searchParams.get('locality')?.trim();
    const skipCache = searchParams.get('skipCache') === 'true';

    let targetInput: { state: string; district?: string; locality?: string } | string;

    if (locationKey) {
      targetInput = locationKey;
    } else if (state) {
      targetInput = {
        state,
        district: district || undefined,
        locality: locality || undefined,
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Geographic target is required. Provide ?locationKey=... or ?state=... (with optional &district= &locality=).',
        },
        { status: 400 }
      );
    }

    const bundle = await getEvidenceBundle(targetInput, { skipCache });

    return NextResponse.json(
      {
        success: true,
        bundle,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API /api/evidence/bundle Error]:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to synthesize evidence bundle.',
      },
      { status: 500 }
    );
  }
}
