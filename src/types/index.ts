export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RequestStatus = 'SUBMITTED' | 'ANALYZED' | 'CLUSTERED' | 'IN_REVIEW' | 'ALLOCATED' | 'RESOLVED';

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export interface CivicCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  badgeColor: string;
}

export interface RequestLocation {
  state: string;
  district: string;
  wardOrPanchayat: string;
  landmark?: string;
  pincode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AIAnalysisPreview {
  summary: string;
  urgencyScore: number; // 0 - 100
  urgencyLevel: UrgencyLevel;
  confidenceScore: number; // 0 - 100
  detectedCategory: string;
  infrastructureCorrelations: string[];
  keyFactors: string[];
  suggestedAction: string;
}

export interface CitizenRequest {
  id: string;
  trackingNumber: string;
  citizenName?: string;
  contactNumber?: string;
  language: string;
  category: string;
  location: RequestLocation;
  description: string;
  voiceNoteAttached?: boolean;
  status: RequestStatus;
  urgency: UrgencyLevel;
  priorityScore: number; // 0 - 100
  submittedAt: string;
  aiAnalysis?: AIAnalysisPreview;
}

export interface DashboardMetrics {
  totalRequests: number;
  highPriorityRequests: number;
  infrastructureGaps: number;
  statesCovered: number;
  avgResolutionDays: number;
  hotspotsDetected: number;
}

export interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PriorityMetric {
  level: UrgencyLevel;
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}

export interface PriorityWeights {
  demand: number;
  population: number;
  urgency: number;
  infrastructureGap: number;
}

export interface PriorityBreakdown {
  demandScore: number;
  populationScore: number;
  urgencyScore: number;
  infrastructureGapScore: number;
  weights: PriorityWeights;
}

export interface DemandHotspot {
  locationKey: string;
  locality: string;
  district: string;
  state: string;
  totalRequests: number;
  affectedPopulation: number;
  highUrgencyRequests: number;
  infrastructureRequests?: number;
  categoryCounts: Record<string, number>;
  topCategory: string;
  locationSource: 'citizen_provided';
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  priorityMethodology?: string;
  sourceDistribution?: {
    voice: number;
    text: number;
  };
  languagesRepresented?: string[];
  dataSources?: {
    citizenSubmission: number;
    syntheticDemo: number;
  };

  // Optional compatibility fields for legacy mock visualization
  id?: string;
  name?: string;
  ward?: string;
  primaryCategory?: string;
  requestCount?: number;
  urgencyScore?: number;
  populationImpact?: number;
  trend?: 'INCREASING' | 'STABLE' | 'DECREASING';
  summary?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CategorySummary {
  category: string;
  count: number;
  percentage: number;
}

export interface HotspotsApiResponse {
  hotspots: DemandHotspot[];
  totalRequests: number;
  geographicallyMappedRequests: number;
  unmappedRequests: number;
}

export interface DevelopmentRecommendationEvidence {
  totalRequests: number;
  affectedPopulation: number;
  highUrgencyRequests: number;
  infrastructureRequests: number;
  topCategory: string;
  categoryDistribution: Record<string, number>;
  priorityScore: number;
}

export interface DevelopmentRecommendation {
  hotspotLocation: {
    locality: string;
    district: string;
    state: string;
  };
  headline: string;
  problemStatement: string;
  recommendedIntervention: string;
  rationale: string;
  evidence: DevelopmentRecommendationEvidence;
  suggestedDepartment: string;
  implementationConsiderations: string[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  generatedBy: 'gemini';
  cached?: boolean;
  generatedAt?: string;
  sourceDataVersion?: string;
}

export interface RecommendationRequestPayload {
  locationKey: string;
}

export interface AIRecommendation {
  id: string;
  code: string;
  title: string;
  targetRegion: string;
  state: string;
  category: string;
  priorityLevel: UrgencyLevel;
  demandScore: number;
  urgencyRationale: string;
  estimatedBudget: string;
  estimatedBeneficiaries: string;
  projectedTimeline: string;
  geminiConfidence: number;
  keyEvidenceFactors: string[];
  status: 'PENDING_SANCTION' | 'UNDER_EVALUATION' | 'APPROVED';
}

export type GeminiUrgency = 'Low' | 'Medium' | 'High';

export type GeminiCategory =
  | 'Roads & Transport'
  | 'Healthcare'
  | 'Water & Sanitation'
  | 'Education'
  | 'Agriculture'
  | 'Electricity'
  | 'Climate & Environment'
  | 'Digital Public Infrastructure'
  | 'Public Safety'
  | 'Housing'
  | 'Other';

export interface GeminiAnalysisResult {
  language: string;
  translated_text: string;
  category: GeminiCategory | string;
  issue: string;
  state: string;
  district: string;
  locality: string;
  location_source: 'citizen_provided' | 'not_provided';
  location_confidence: 'high' | 'none';
  affected_infrastructure: string;
  urgency: GeminiUrgency | string;
  affected_population_estimate: number | null;
  government_department: string;
  department_source: 'citizen_provided' | 'ai_inferred';
  summary: string;
  recommended_action: string;
}

export interface VoiceTranscriptionResult {
  detectedLanguage: string;
  originalTranscript: string;
  translatedText?: string;
  durationSeconds?: number;
  confidence?: 'high' | 'medium' | 'low';
}

export interface VoiceTranscribeRequestPayload {
  audioBase64?: string;
  mimeType?: string;
  sampleKey?: string;
}

export interface AnalyzeRequestPayload {
  complaint: string;
  selectedLanguage?: string;
  state?: string;
  district?: string;
  locality?: string;
  sourceType?: 'voice' | 'text';
  originalLanguage?: string;
  originalTranscript?: string;
  demoRunId?: string;
}

export interface CitizenRequestFirestoreDoc {
  requestId: string;
  originalText: string;
  language: string;
  translatedText: string;
  category: string;
  issue: string;
  state: string;
  district: string;
  locality: string;
  locationSource: 'citizen_provided' | 'not_provided';
  locationConfidence: 'high' | 'none';
  affectedInfrastructure: string;
  urgency: string;
  affectedPopulationEstimate: number | null;
  governmentDepartment: string;
  departmentSource: 'citizen_provided' | 'ai_inferred';
  summary: string;
  recommendedAction: string;
  status: 'new';
  sourceType?: 'voice' | 'text';
  originalLanguage?: string;
  originalTranscript?: string;
  dataSource?: 'citizen_submission' | 'synthetic_demo';
  demoRunId?: string;
  createdAt: any; // Firestore Timestamp
}

export interface AnalyzeRequestResponse {
  success: boolean;
  requestId: string;
  status: string;
  data: GeminiAnalysisResult;
  firestoreDocId?: string;
  sourceType?: 'voice' | 'text';
}

// Re-export Phase 6 Evidence Integration Layer types
export * from './evidence';




