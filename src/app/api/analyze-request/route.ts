import { NextRequest, NextResponse } from 'next/server';
import { analyzeCitizenComplaint } from '@/lib/gemini';
import { saveCitizenRequestToFirestore } from '@/lib/citizenRequestService';
import { isFirebaseConfigured } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body in request.' },
        { status: 400 }
      );
    }

    const { complaint, selectedLanguage, state, district, locality, sourceType, originalLanguage, originalTranscript, demoRunId } = body || {};

    // 1. Validate input
    if (!complaint || typeof complaint !== 'string' || complaint.trim().length === 0) {
      return NextResponse.json(
        { error: 'Complaint text is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (complaint.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a more detailed complaint description (at least 5 characters).' },
        { status: 400 }
      );
    }

    // 2. Gemini analysis
    let analysis: any;
    try {
      analysis = await analyzeCitizenComplaint(complaint, {
        selectedLanguage: selectedLanguage || originalLanguage,
        state,
        district,
        locality,
      });
    } catch (geminiError: any) {
      console.error('[Gemini Analysis Error]:', geminiError?.message || geminiError);
      return NextResponse.json(
        {
          success: false,
          error: geminiError?.message || 'Gemini AI analysis failed.',
          code: 'GEMINI_ERROR',
        },
        { status: 500 }
      );
    }

    // 3. Validate Gemini structured response
    if (!analysis || !analysis.category || !analysis.issue || !analysis.urgency) {
      console.error('[Gemini Validation Error]: Malformed structured response received.');
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini AI returned incomplete or malformed structured data.',
          code: 'INVALID_AI_OUTPUT',
        },
        { status: 502 }
      );
    }

    // 4. Validate Firebase configuration
    if (!isFirebaseConfigured()) {
      console.error(
        '[Firebase Configuration Error]: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY is missing.'
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Firebase credentials are not configured on the server. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local.',
          code: 'FIREBASE_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // 5. Generate request ID & save document to Firestore
    try {
      const saveResult = await saveCitizenRequestToFirestore({
        originalText: complaint,
        analysis,
        sourceType: sourceType === 'voice' ? 'voice' : 'text',
        originalLanguage: originalLanguage || analysis.language,
        originalTranscript: originalTranscript || complaint,
        demoRunId: typeof demoRunId === 'string' ? demoRunId : undefined,
      });

      // 6. Return saved request
      return NextResponse.json(
        {
          success: true,
          requestId: saveResult.requestId,
          status: 'Successfully submitted',
          data: analysis,
          firestoreDocId: saveResult.firestoreDocId,
          sourceType: saveResult.savedDocument.sourceType,
        },
        { status: 200 }
      );
    } catch (firestoreError: any) {
      // Safe logging without credentials
      console.error(
        '[Firestore Persistence Error]: Failed to save citizen request document to Firestore.',
        firestoreError?.message || firestoreError
      );

      return NextResponse.json(
        {
          success: false,
          error: `Database persistence failed: Unable to save citizen request to Firestore (${
            firestoreError?.message || 'Transaction error'
          }). The request was not submitted.`,
          code: 'FIRESTORE_PERSISTENCE_ERROR',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[API /api/analyze-request Error]:', error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred while processing the request.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
