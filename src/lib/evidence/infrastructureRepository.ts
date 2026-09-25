/**
 * JanSetu AI — Phase 6B: Infrastructure Evidence Repository
 * Server-side Firestore persistence for infrastructure gap and asset data.
 * Collection: evidence_infrastructure
 */

import { getFirestoreDb } from '../firebaseAdmin';
import { computeGeographyDocId, normalizeGeography } from '../geographyNormalizer';
import type { InfrastructureEvidence } from '../../types/evidence';
import type { GeographicTarget } from './providers';
import { assertValidEvidenceRecord } from './validation';

export const INFRASTRUCTURE_COLLECTION = 'evidence_infrastructure';

export class InfrastructureRepository {
  private get collection() {
    const db = getFirestoreDb();
    return db.collection(INFRASTRUCTURE_COLLECTION);
  }

  /**
   * Computes the deterministic document ID for a given geographic target.
   */
  public computeDocId(target: GeographicTarget): string {
    return computeGeographyDocId(target.state, target.district, target.locality);
  }

  /**
   * Retrieves infrastructure evidence for a geographic target by its deterministic location hash.
   */
  public async getByLocation(target: GeographicTarget): Promise<InfrastructureEvidence | null> {
    const docId = this.computeDocId(target);
    return this.getById(docId);
  }

  /**
   * Retrieves infrastructure evidence by direct document ID.
   */
  public async getById(docId: string): Promise<InfrastructureEvidence | null> {
    if (!docId) return null;
    const docSnap = await this.collection.doc(docId).get();
    if (!docSnap.exists) {
      return null;
    }
    return docSnap.data() as InfrastructureEvidence;
  }

  /**
   * Upserts an infrastructure evidence record into Firestore.
   * Validates schema and provenance integrity prior to persistence.
   */
  public async upsert(record: InfrastructureEvidence): Promise<string> {
    assertValidEvidenceRecord(record);

    // Compute canonical normalized geography
    const norm = normalizeGeography(record.state, record.district, record.locality);
    const docId = computeGeographyDocId(norm.state, norm.district, norm.locality);

    const docPayload = {
      ...record,
      state: norm.state,
      district: norm.district || undefined,
      locality: norm.locality || undefined,
      geographyLevel: norm.geographyLevel,
      lastUpdated: new Date().toISOString(),
    };

    await this.collection.doc(docId).set(docPayload, { merge: true });
    return docId;
  }

  /**
   * Checks whether evidence exists for a given document ID.
   */
  public async exists(docId: string): Promise<boolean> {
    if (!docId) return false;
    const docSnap = await this.collection.doc(docId).get();
    return docSnap.exists;
  }

  /**
   * Deletes an infrastructure evidence record by document ID (useful for test lifecycle cleanup).
   */
  public async delete(docId: string): Promise<boolean> {
    if (!docId) return false;
    await this.collection.doc(docId).delete();
    return true;
  }
}

// Export singleton instance
export const infrastructureRepository = new InfrastructureRepository();
