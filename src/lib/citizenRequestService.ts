import { FieldValue, Transaction, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestoreDb } from './firebaseAdmin';
import { GeminiAnalysisResult, CitizenRequestFirestoreDoc } from '@/types';

export interface SaveCitizenRequestParams {
  originalText: string;
  analysis: GeminiAnalysisResult;
  sourceType?: 'voice' | 'text';
  originalLanguage?: string;
  originalTranscript?: string;
  dataSource?: 'citizen_submission' | 'synthetic_demo';
  demoRunId?: string;
}

export interface SaveCitizenRequestResult {
  requestId: string;
  firestoreDocId: string;
  savedDocument: Omit<CitizenRequestFirestoreDoc, 'createdAt'> & { createdAtIso: string };
}

/**
 * Saves a validated citizen request and its Gemini analysis into Firestore collection 'citizen_requests'.
 * Generates an atomic sequential readable request ID (e.g. JNS-000001) using a Firestore transaction.
 */
export async function saveCitizenRequestToFirestore({
  originalText,
  analysis,
  sourceType = 'text',
  originalLanguage,
  originalTranscript,
  dataSource = 'citizen_submission',
  demoRunId,
}: SaveCitizenRequestParams): Promise<SaveCitizenRequestResult> {
  const db = getFirestoreDb();
  const counterRef = db.collection('system_counters').doc('citizen_requests');
  const collectionRef = db.collection('citizen_requests');

  return await db.runTransaction(async (transaction: Transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let nextNumber = 1;

    if (counterDoc.exists) {
      const data = counterDoc.data();
      const lastNumber = typeof data?.lastNumber === 'number' ? data.lastNumber : 0;
      nextNumber = lastNumber + 1;
    } else {
      // If counter doc doesn't exist, check existing citizen_requests count to avoid collisions
      try {
        const snapshot = await collectionRef.get();
        // Filter out non-request or setup docs (e.g., docs without requestId)
        let maxExisting = 0;
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          const id = doc.data()?.requestId;
          if (typeof id === 'string' && id.startsWith('JNS-')) {
            const num = parseInt(id.replace('JNS-', ''), 10);
            if (!isNaN(num) && num > maxExisting) {
              maxExisting = num;
            }
          }
        });
        nextNumber = maxExisting > 0 ? maxExisting + 1 : 1;
      } catch {
        nextNumber = 1;
      }
    }

    // Format readable ID e.g. JNS-000001
    const requestId = `JNS-${String(nextNumber).padStart(6, '0')}`;

    // Update counter
    transaction.set(
      counterRef,
      {
        lastNumber: nextNumber,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Prepare document data conforming to Phase 5 schema
    const newDocRef = collectionRef.doc();
    const documentData: CitizenRequestFirestoreDoc = {
      requestId,
      originalText: originalText.trim(),
      language: analysis.language,
      translatedText: analysis.translated_text,
      category: analysis.category,
      issue: analysis.issue,
      state: analysis.state || '',
      district: analysis.district || '',
      locality: analysis.locality || '',
      locationSource: analysis.location_source,
      locationConfidence: analysis.location_confidence,
      affectedInfrastructure: analysis.affected_infrastructure,
      urgency: analysis.urgency,
      affectedPopulationEstimate: analysis.affected_population_estimate,
      governmentDepartment: analysis.government_department,
      departmentSource: analysis.department_source,
      summary: analysis.summary,
      recommendedAction: analysis.recommended_action,
      status: 'new',
      sourceType: sourceType === 'voice' ? 'voice' : 'text',
      originalLanguage: originalLanguage || analysis.language,
      originalTranscript: originalTranscript || originalText.trim(),
      dataSource,
      ...(demoRunId ? { demoRunId } : {}),
      createdAt: FieldValue.serverTimestamp(),
    };

    transaction.set(newDocRef, documentData);

    return {
      requestId,
      firestoreDocId: newDocRef.id,
      savedDocument: {
        ...documentData,
        createdAtIso: new Date().toISOString(),
      },
    };
  });
}
