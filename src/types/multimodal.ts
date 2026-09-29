export type MultimodalInputType = 'audio' | 'image' | 'video' | 'document' | 'telemetry' | 'fusion';

export type ModalityCategory = 'vhf_audio' | 'slick_visual' | 'manifest_document' | 'ais_telemetry' | 'cross_modal_fusion';

export interface PhysicsScore {
  mmsi: string;
  vesselName: string;
  score: number; // 0 - 100
  distanceKm: number;
  timeMatchScore: number;
  driftAlignmentScore: number;
  backscatterMatch: number;
  rationale: string;
}

export interface MultimodalExtractionResult {
  modality: ModalityCategory;
  timestamp: string;
  vesselName: string | null;
  mmsi: string | null;
  imo: string | null;
  callsign: string | null;
  position: {
    lat: number;
    lng: number;
    accuracyKm?: number;
    locationName?: string;
  } | null;
  urgency: 'MAYDAY' | 'PAN-PAN' | 'SECURITE' | 'ROUTINE' | null;
  substance: string | null;
  imdgClass: string | null;
  quantity: string | null;
  sheenClassification: string | null; // e.g. "Continuous True Oil Film", "Rainbow Sheen", "Metallic Sheen"
  estimatedExtentKm2: number | null;
  sourceConfidence: number; // 0 - 100
  transcript: string | null;
  conflicts: Array<{
    field: string;
    sourceA: string;
    sourceB: string;
    description: string;
  }>;
  rawSummary: string;
  recommendations: string[];
}

export interface MultimodalAttributionResult {
  culpritVessel: {
    name: string;
    mmsi: string;
    imo: string;
    flag: string;
    cpaKm: number;
    speedKnots: number;
    transponderGapMinutes: number;
  };
  combinedConfidence: number; // 0 - 100
  aiWeight: number; // e.g. 50%
  physicsWeight: number; // e.g. 50%
  sourcesCited: Array<{
    modality: ModalityCategory;
    source: string;
    snippet: string;
    weightPercent: number;
    confidence: number;
  }>;
  conflictsIdentified: Array<{
    field: string;
    sourceA: string;
    sourceB: string;
    description: string;
    resolvedBy: string;
  }>;
  marpolViolation: string;
  recommendedActions: string[];
  evidenceLog: Array<{
    step: number;
    timestamp: string;
    modality: string;
    observation: string;
    confidence: number;
  }>;
}

export interface MarpolConsignmentReport {
  dossierId: string;
  generatedAt: string;
  incidentLocation: {
    lat: number;
    lng: number;
    areaDescription: string;
  };
  spillCharacteristics: {
    substance: string;
    imdgCode: string;
    volumeM3: number;
    slickAreaKm2: number;
    bonnCode: string;
  };
  attributedVessel: {
    name: string;
    mmsi: string;
    imo: string;
    flag: string;
    registeredOwner: string;
    classificationSociety: string;
  };
  evidenceLog: Array<{
    step: number;
    source: string;
    finding: string;
    weight: string;
  }>;
  legalConclusions: string[];
  ch16AllClearBroadcastScript: string;
}

export interface PastIncident {
  id: string;
  title: string;
  date: string;
  location: string;
  coordinates: { lat: number; lng: number };
  substance: string;
  imdgClass: string;
  volumeM3: number;
  culprit: string;
  summary: string;
  relevanceScore: number;
  matchedKeywords: string[];
}

export interface MultimodalEvidenceItem {
  id: string;
  type: MultimodalInputType;
  title: string;
  fileName?: string;
  fileSize?: string;
  timestamp: string;
  previewUrl?: string;
  dataUri?: string;
  textContent?: string;
  parsedResult?: MultimodalExtractionResult;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
}
