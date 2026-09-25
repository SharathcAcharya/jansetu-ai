/**
 * JanSetu AI — Phase 6C: Evidence Bundle Cache
 * Server-side Firestore cache for synthesized evidence bundles.
 * Collection: evidence_bundles_cache
 * Document ID: computeGeographyDocId()
 *
 * Implements deterministic TTL, source data version invalidation,
 * and explicit invalidation to avoid serving stale evidence indefinitely.
 */

import { getFirestoreDb } from '../firebaseAdmin';
import { computeGeographyDocId, normalizeGeography } from '../geographyNormalizer';
import type { EvidenceBundle } from '../../types/evidence';
import type { GeographicTarget } from './providers';

export const EVIDENCE_BUNDLE_CACHE_COLLECTION = 'evidence_bundles_cache';

// Default cache TTL: 1 hour (3,600,000 ms)
export const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;

export interface CachedBundleEntry {
  bundle: EvidenceBundle;
  synthesizedAt: string;
  bundleVersion: string;
  sourceDataVersion: string;
  locationKey: string;
  cachedAt: string;
  expiresAt: string;
}

export class EvidenceBundleCache {
  private get collection() {
    const db = getFirestoreDb();
    return db.collection(EVIDENCE_BUNDLE_CACHE_COLLECTION);
  }

  /**
   * Computes the deterministic document ID for caching a geographic target.
   */
  public computeDocId(target: GeographicTarget): string {
    return computeGeographyDocId(target.state, target.district, target.locality);
  }

  /**
   * Retrieves a cached bundle by document ID.
   * Validates both time-based expiration and source data version matching.
   * If stale or invalidated, returns null.
   */
  public async getCachedBundle(
    docId: string,
    options?: {
      expectedSourceVersion?: string;
      maxAgeMs?: number;
    }
  ): Promise<EvidenceBundle | null> {
    if (!docId) return null;

    try {
      const docSnap = await this.collection.doc(docId).get();
      if (!docSnap.exists) {
        return null;
      }

      const data = docSnap.data() as CachedBundleEntry;
      if (!data || !data.bundle) {
        return null;
      }

      const now = Date.now();
      const cachedTime = new Date(data.cachedAt || data.synthesizedAt).getTime();
      const maxAge = options?.maxAgeMs ?? DEFAULT_CACHE_TTL_MS;

      // 1. Time-based staleness check
      if (Number.isFinite(cachedTime) && now - cachedTime > maxAge) {
        return null;
      }

      // 2. Explicit expiresAt check if present
      if (data.expiresAt) {
        const expiresTime = new Date(data.expiresAt).getTime();
        if (Number.isFinite(expiresTime) && now > expiresTime) {
          return null;
        }
      }

      // 3. Source data version check
      if (
        options?.expectedSourceVersion &&
        data.sourceDataVersion &&
        data.sourceDataVersion !== options.expectedSourceVersion
      ) {
        return null;
      }

      return data.bundle;
    } catch (err) {
      console.warn('[EvidenceBundleCache] Error reading cache doc:', docId, err);
      return null;
    }
  }

  /**
   * Caches a synthesized bundle in Firestore under the deterministic document ID.
   */
  public async setCachedBundle(
    docId: string,
    bundle: EvidenceBundle,
    sourceDataVersion: string,
    ttlMs: number = DEFAULT_CACHE_TTL_MS
  ): Promise<void> {
    if (!docId || !bundle) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

    const entry: CachedBundleEntry = {
      bundle,
      synthesizedAt: bundle.synthesizedAt || now.toISOString(),
      bundleVersion: bundle.bundleVersion,
      sourceDataVersion: sourceDataVersion || bundle.sourceDataVersion || 'v1',
      locationKey: bundle.location.locationKey,
      cachedAt: now.toISOString(),
      expiresAt,
    };

    try {
      // Remove all undefined fields before saving to Firestore
      const cleanEntry = JSON.parse(JSON.stringify(entry));
      await this.collection.doc(docId).set(cleanEntry);
    } catch (err) {
      console.warn('[EvidenceBundleCache] Error writing cache doc:', docId, err);
    }
  }

  /**
   * Explicitly invalidates (deletes) a cached bundle.
   */
  public async invalidateCachedBundle(docId: string): Promise<boolean> {
    if (!docId) return false;

    try {
      const docRef = this.collection.doc(docId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return false;
      }
      await docRef.delete();
      return true;
    } catch (err) {
      console.warn('[EvidenceBundleCache] Error invalidating cache doc:', docId, err);
      return false;
    }
  }
}

export const evidenceBundleCache = new EvidenceBundleCache();
