/**
 * JanSetu AI — Extensible Multi-Source Evidence Architecture (Phase 5)
 * 
 * Provides unified, pluggable interfaces for:
 * 1. Citizen Reports (live submissions & vernacular speech)
 * 2. Demographic Data (Census, SECC, vulnerable population baselines)
 * 3. Infrastructure Assets & Gaps (PMGSY, Jal Jeevan Mission, NHM, DISCOM)
 * 4. Public Investment & Outlays (District Capex allocations, state budgets)
 * 
 * Demonstrations use realistic baseline projections strictly stamped with:
 * dataSource: "synthetic_demo"
 */

export interface BaseEvidenceRecord {
  recordId: string;
  locationKey: string;
  locality?: string;
  district: string;
  state: string;
  dataSource: 'citizen_submission' | 'synthetic_demo' | 'gov_open_data';
  lastUpdated: string;
}

export interface DemographicProfile extends BaseEvidenceRecord {
  totalPopulation: number;
  farmingFamilies: number;
  vulnerableHouseholds: number;
  femaleLiteracyRatePercent: number;
  censusYearOrProjection: string;
}

export interface InfrastructureAsset extends BaseEvidenceRecord {
  sector: string;
  facilityName: string;
  assetType: string;
  functionalStatus: 'OPERATIONAL' | 'DEGRADED' | 'DEFUNCT' | 'UNDER_CONSTRUCTION';
  distanceToNearestAlternateKm: number;
  lastInspectionDate?: string;
}

export interface PublicInvestmentRecord extends BaseEvidenceRecord {
  department: string;
  schemeName: string;
  financialYear: string;
  allocatedBudgetInrLakhs: number;
  expenditureToDateInrLakhs: number;
  utilizationRatePercent: number;
  sanctionStatus: 'SANCTIONED' | 'PROPOSED' | 'PENDING_APPROVAL';
}

/**
 * Adapter interface for Demographic Data Providers
 */
export interface IDemographicDataProvider {
  getDemographicProfile(locationKey: string): Promise<DemographicProfile | null>;
  getAllProfiles(): Promise<DemographicProfile[]>;
}

/**
 * Adapter interface for Infrastructure Data Providers
 */
export interface IInfrastructureDataProvider {
  getInfrastructureAssets(locationKey: string): Promise<InfrastructureAsset[]>;
  getAllAssets(): Promise<InfrastructureAsset[]>;
}

/**
 * Adapter interface for Public Investment Data Providers
 */
export interface IPublicInvestmentDataProvider {
  getPublicInvestments(locationKey: string): Promise<PublicInvestmentRecord[]>;
  getAllInvestments(): Promise<PublicInvestmentRecord[]>;
}

/**
 * Realistic baseline synthetic demographic repository for hackathon demonstration.
 * All records strictly contain dataSource: "synthetic_demo".
 */
export const SYNTHETIC_DEMOGRAPHIC_BASELINES: Record<string, DemographicProfile> = {
  'karkala | karnataka': {
    recordId: 'DEMO-KAR-01',
    locationKey: 'Karkala | Karnataka',
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
    totalPopulation: 25824,
    farmingFamilies: 1420,
    vulnerableHouseholds: 380,
    femaleLiteracyRatePercent: 86.4,
    censusYearOrProjection: '2024 (Projected)',
    dataSource: 'synthetic_demo',
    lastUpdated: '2026-09-20',
  },
  'varanasi | uttar pradesh': {
    recordId: 'DEMO-UP-02',
    locationKey: 'Varanasi | Uttar Pradesh',
    locality: 'Rohania Ward 7',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    totalPopulation: 42100,
    farmingFamilies: 850,
    vulnerableHouseholds: 1200,
    femaleLiteracyRatePercent: 72.8,
    censusYearOrProjection: '2024 (Projected)',
    dataSource: 'synthetic_demo',
    lastUpdated: '2026-09-20',
  },
  'barmer | rajasthan': {
    recordId: 'DEMO-RAJ-03',
    locationKey: 'Barmer | Rajasthan',
    locality: 'Sheo Village',
    district: 'Barmer',
    state: 'Rajasthan',
    totalPopulation: 14500,
    farmingFamilies: 1800,
    vulnerableHouseholds: 650,
    femaleLiteracyRatePercent: 54.2,
    censusYearOrProjection: '2024 (Projected)',
    dataSource: 'synthetic_demo',
    lastUpdated: '2026-09-20',
  },
  'wayanad | kerala': {
    recordId: 'DEMO-KER-04',
    locationKey: 'Wayanad | Kerala',
    locality: 'Meppadi Panchayat',
    district: 'Wayanad',
    state: 'Kerala',
    totalPopulation: 18200,
    farmingFamilies: 1100,
    vulnerableHouseholds: 290,
    femaleLiteracyRatePercent: 91.5,
    censusYearOrProjection: '2024 (Projected)',
    dataSource: 'synthetic_demo',
    lastUpdated: '2026-09-20',
  },
  'nagpur | maharashtra': {
    recordId: 'DEMO-MAH-05',
    locationKey: 'Nagpur | Maharashtra',
    locality: 'Umred Taluk',
    district: 'Nagpur',
    state: 'Maharashtra',
    totalPopulation: 31000,
    farmingFamilies: 1650,
    vulnerableHouseholds: 810,
    femaleLiteracyRatePercent: 79.4,
    censusYearOrProjection: '2024 (Projected)',
    dataSource: 'synthetic_demo',
    lastUpdated: '2026-09-20',
  },
  'dharmapuri | tamil nadu': {
    recordId: 'DEMO-TN-06',
    locationKey: 'Dharmapuri | Tamil Nadu',
    locality: 'Pennagaram',
    district: 'Dharmapuri',
    state: 'Tamil Nadu',
    totalPopulation: 22400,
    farmingFamilies: 1350,
    vulnerableHouseholds: 520,
    femaleLiteracyRatePercent: 68.9,
    censusYearOrProjection: '2024 (Projected)',
    dataSource: 'synthetic_demo',
    lastUpdated: '2026-09-20',
  },
};

/**
 * Realistic baseline synthetic infrastructure repository for hackathon demonstration.
 */
export const SYNTHETIC_INFRASTRUCTURE_BASELINES: Record<string, InfrastructureAsset[]> = {
  'karkala | karnataka': [
    {
      recordId: 'INFRA-KAR-01',
      locationKey: 'Karkala | Karnataka',
      locality: 'Karkala',
      district: 'Udupi',
      state: 'Karnataka',
      sector: 'Agriculture & Water',
      facilityName: 'Swarna Feeder Canal Section 4',
      assetType: 'Irrigation Canal',
      functionalStatus: 'DEGRADED',
      distanceToNearestAlternateKm: 15,
      dataSource: 'synthetic_demo',
      lastUpdated: '2026-09-18',
    },
    {
      recordId: 'INFRA-KAR-02',
      locationKey: 'Karkala | Karnataka',
      locality: 'Karkala',
      district: 'Udupi',
      state: 'Karnataka',
      sector: 'Water & Sanitation',
      facilityName: 'Anekere Community Water Storage Reservoir',
      assetType: 'Water Reservoir',
      functionalStatus: 'DEGRADED',
      distanceToNearestAlternateKm: 12,
      dataSource: 'synthetic_demo',
      lastUpdated: '2026-09-18',
    },
  ],
  'varanasi | uttar pradesh': [
    {
      recordId: 'INFRA-UP-01',
      locationKey: 'Varanasi | Uttar Pradesh',
      locality: 'Rohania Ward 7',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      sector: 'Roads & Transport',
      facilityName: 'Rohania Link Road NH-19 Feeder',
      assetType: 'Arterial Bituminous Road',
      functionalStatus: 'DEGRADED',
      distanceToNearestAlternateKm: 8,
      dataSource: 'synthetic_demo',
      lastUpdated: '2026-09-19',
    },
  ],
};

/**
 * Realistic baseline synthetic public investment repository for hackathon demonstration.
 */
export const SYNTHETIC_PUBLIC_INVESTMENTS: Record<string, PublicInvestmentRecord[]> = {
  'karkala | karnataka': [
    {
      recordId: 'INV-KAR-01',
      locationKey: 'Karkala | Karnataka',
      locality: 'Karkala',
      district: 'Udupi',
      state: 'Karnataka',
      department: 'Ministry of Jal Shakti',
      schemeName: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
      financialYear: '2025-26',
      allocatedBudgetInrLakhs: 185.0,
      expenditureToDateInrLakhs: 42.5,
      utilizationRatePercent: 23.0,
      sanctionStatus: 'SANCTIONED',
      dataSource: 'synthetic_demo',
      lastUpdated: '2026-09-15',
    },
  ],
  'varanasi | uttar pradesh': [
    {
      recordId: 'INV-UP-01',
      locationKey: 'Varanasi | Uttar Pradesh',
      locality: 'Rohania Ward 7',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      department: 'Public Works Department (PWD)',
      schemeName: 'Chief Minister Road Development Scheme',
      financialYear: '2025-26',
      allocatedBudgetInrLakhs: 95.0,
      expenditureToDateInrLakhs: 15.0,
      utilizationRatePercent: 15.8,
      sanctionStatus: 'PROPOSED',
      dataSource: 'synthetic_demo',
      lastUpdated: '2026-09-16',
    },
  ],
};

/**
 * Extensible Demographic Data Provider
 */
export class SyntheticDemographicDataProvider implements IDemographicDataProvider {
  async getDemographicProfile(locationKey: string): Promise<DemographicProfile | null> {
    const key = locationKey.trim().toLowerCase();
    for (const [k, profile] of Object.entries(SYNTHETIC_DEMOGRAPHIC_BASELINES)) {
      if (k === key || key.includes(profile.district.toLowerCase()) || key.includes(profile.locality?.toLowerCase() || '')) {
        return { ...profile };
      }
    }
    return null;
  }

  async getAllProfiles(): Promise<DemographicProfile[]> {
    return Object.values(SYNTHETIC_DEMOGRAPHIC_BASELINES);
  }
}

/**
 * Extensible Infrastructure Data Provider
 */
export class SyntheticInfrastructureDataProvider implements IInfrastructureDataProvider {
  async getInfrastructureAssets(locationKey: string): Promise<InfrastructureAsset[]> {
    const key = locationKey.trim().toLowerCase();
    for (const [k, assets] of Object.entries(SYNTHETIC_INFRASTRUCTURE_BASELINES)) {
      if (k === key || key.includes(k.split(' | ')[0])) {
        return [...assets];
      }
    }
    return [];
  }

  async getAllAssets(): Promise<InfrastructureAsset[]> {
    return Object.values(SYNTHETIC_INFRASTRUCTURE_BASELINES).flat();
  }
}

/**
 * Extensible Public Investment Data Provider
 */
export class SyntheticPublicInvestmentDataProvider implements IPublicInvestmentDataProvider {
  async getPublicInvestments(locationKey: string): Promise<PublicInvestmentRecord[]> {
    const key = locationKey.trim().toLowerCase();
    for (const [k, investments] of Object.entries(SYNTHETIC_PUBLIC_INVESTMENTS)) {
      if (k === key || key.includes(k.split(' | ')[0])) {
        return [...investments];
      }
    }
    return [];
  }

  async getAllInvestments(): Promise<PublicInvestmentRecord[]> {
    return Object.values(SYNTHETIC_PUBLIC_INVESTMENTS).flat();
  }
}
