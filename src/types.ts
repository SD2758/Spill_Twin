/**
 * SpillTwin Satellite SAR Investigation System
 * Shared TypeScript Definitions
 */

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface SarMetadata {
  satelliteName: string;
  sensorType: 'C-band' | 'X-band' | 'L-band';
  polarization: 'VV' | 'VH' | 'HH' | 'HV' | 'VV+VH';
  acquisitionTime: string;
  orbitPass: 'Ascending' | 'Descending';
  incidentAngle: number; // degrees
  resolutionMeters: number;
  sceneBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface EnvironmentalConditions {
  windSpeedMps: number; // m/s
  windDirectionDeg: number; // degrees from north (coming from)
  currentSpeedMps: number; // m/s
  currentDirectionDeg: number; // degrees towards
  waterTemperatureC: number;
  waveHeightMeters: number;
  oilApiGravity: number; // API density
  spillVolumeEstimatedM3: number;
}

export interface SlickPolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][]; // [lng, lat][]
  };
  properties: {
    id: string;
    areaKm2: number;
    areaHectares: number;
    perimeterKm: number;
    meanBackscatterDb: number;
    ambientBackscatterDb: number;
    dampingRatioDb: number;
    slickType: 'Heavy Crude' | 'Refined Fuel' | 'Bunker Fuel' | 'Biogenic Lookalike';
  };
}

export interface SuspectCandidate {
  id: string;
  mmsi: string;
  vesselName: string;
  callsign: string;
  flag: string;
  vesselType: 'Crude Oil Tanker' | 'Chemical Tanker' | 'Bulk Carrier' | 'Container Ship' | 'Cargo' | 'Offshore Platform';
  imo: string;
  closestPointDistanceKm: number;
  timeOfClosestApproach: string;
  speedKnots: number;
  headingDeg: number;
  trajectoryMatchScore: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  aisAnomaly: boolean;
  anomalyReason?: string;
  coordinates: GeoCoordinate;
  historicalTrack: GeoCoordinate[];
}

export interface DriftParticle {
  id: number;
  lat: number;
  lng: number;
  ageHours: number;
  massFractionRemaining: number;
  status: 'active' | 'evaporated' | 'beached';
}

export interface DriftStep {
  timestepHours: number;
  timestamp: string;
  centroid: GeoCoordinate;
  majorAxisKm: number;
  minorAxisKm: number;
  orientationDeg: number;
  particles: DriftParticle[];
  uncertaintyPolygon: [number, number][]; // [lat, lng][]
  evaporationPercentage: number;
  areaKm2: number;
}

export interface SarAnalysisResult {
  id: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'processing';
  sarMetadata: SarMetadata;
  environmentalConditions: EnvironmentalConditions;
  detection: {
    slickDetected: boolean;
    confidenceScore: number; // 0 - 100
    confidenceRating: 'High' | 'Moderate' | 'Low' | 'Inconclusive / Clean Water';
    braggDampingDetected: boolean;
    contrastRatioDb: number;
    contrastGradient: number;
    windConditionSuitability: 'Optimal (3-12 m/s)' | 'Sub-optimal (Low wind lookalikes risk)' | 'Sub-optimal (High wind mixing)';
  };
  metrics: {
    centre: GeoCoordinate;
    areaKm2: number;
    areaHectares: number;
    perimeterKm: number;
    lengthMajorAxisKm: number;
    widthMinorAxisKm: number;
    estimatedVolumeMinM3: number;
    estimatedVolumeMaxM3: number;
  };
  slickContour: SlickPolygon;
  candidates: SuspectCandidate[];
  sourceEstimation: {
    backtrackedOrigin: GeoCoordinate;
    estimatedSpillTime: string;
    originUncertaintyRadiusKm: number;
    mostLikelySource: SuspectCandidate | null;
  };
  driftSimulation: {
    modelType: 'Euler-Lagrangian Particle Trajectory + Stokes Drift';
    totalSteps: number;
    forecastHours: number;
    trajectory: DriftStep[];
  };
  uncertaintyAnalysis: {
    confidenceEllipse95: {
      center: GeoCoordinate;
      semiMajorKm: number;
      semiMinorKm: number;
      angleDeg: number;
    };
    sensitivityFactors: {
      factor: string;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }[];
    warnings: string[];
    shorelineIntersectionRisk: boolean;
    estimatedLandfallHours: number | null;
  };
  sarImageUrl?: string;
  processedMaskUrl?: string;
  reportSummary?: string;
}

export interface SampleSarScene {
  id: string;
  title: string;
  region: string;
  description: string;
  satellite: string;
  incidentType: string;
  date: string;
  previewThumbnail: string;
  initialResult: SarAnalysisResult;
}

export interface SatelliteAiHotspot {
  id: string;
  name: string;
  category: 'Spill Incident' | 'Vulnerable Strait' | 'Major Port' | 'Marine Sanctuary' | 'Offshore Rig Zone';
  description: string;
  lat: number;
  lng: number;
  defaultZoom: number;
  recentSpillRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  sensorRecommendation: 'SAR Radar C-Band' | 'True Color Optical' | 'SWIR Infrared';
}

export interface SatelliteAiAnomaly {
  type: 'Heavy Slick' | 'Sheen / Bilge Film' | 'Biogenic Algal Bloom' | 'Vessel Wake' | 'Sediment Plume' | 'Cloud Shadow';
  confidence: number;
  description: string;
  location: string;
  estimatedAreaKm2?: number;
}

export interface SatelliteAiVessel {
  type: string;
  wakeVisible: boolean;
  wakeDirection?: string;
  riskRating: 'SUSPECT' | 'NEUTRAL' | 'HIGH_RISK';
  notes: string;
}

export interface SatelliteAiAnalysisResult {
  scanId: string;
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
    zoom: number;
    areaName?: string;
  };
  sensorMode: 'optical' | 'sar_radar' | 'swir_infrared' | 'thermal';
  detectionVerdict: 'CONFIRMED_SLICK' | 'SUSPECT_ANOMALY' | 'CLEAR_WATER' | 'VESSEL_DISCHARGE' | 'NATURAL_PHENOMENON';
  confidenceScore: number; // 0 - 100
  threatLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  summary: string;
  anomalies: SatelliteAiAnomaly[];
  vessels: SatelliteAiVessel[];
  environmentalFactors: {
    cloudCoverPercent: number;
    sunGlintImpact: 'None' | 'Moderate' | 'Severe';
    estimatedSeaState: string;
    shorelineDistanceKm: number;
    ecologicalVulnerability: 'Critical (Mangroves / Coral / Fisheries)' | 'High' | 'Moderate' | 'Low';
  };
  recommendations: string[];
  fullReportMarkdown: string;
  imageUrl?: string;
  isSimulatedFallback?: boolean;
}

export interface SatelliteAiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface HistoricalSpillVessel {
  name: string;
  type: string;
  flag: string;
  imo?: string;
  mmsi?: string;
  speedKnots: number;
  headingDeg: number;
  distanceFromSpillKm: number;
  role: 'Culprit / Source Vessel' | 'Involved Collision Vessel' | 'Nearby Passing Vessel' | 'First Responder / Salvage Tug';
  notes: string;
}

export interface HistoricalSpillData {
  id: string;
  incidentName: string;
  date: string;
  formattedDate: string;
  locationName: string;
  countryOrSea: string;
  centroid: {
    lat: number;
    lng: number;
    zoom: number;
  };
  spillVolume: {
    amountTonnes: number;
    amountBarrels: number;
    amountM3: number;
    amountGallons: number;
    oilType: string;
    apiGravity: number;
    spillCause: string;
    areaCoveredKm2: number;
  };
  metocean: {
    waterCurrentSpeedKnots: number;
    waterCurrentSpeedMps: number;
    waterCurrentDirectionDeg: number;
    waterCurrentDescription: string;
    windSpeedKnots: number;
    windSpeedMps: number;
    windDirectionDeg: number;
    waveHeightMeters: number;
    waveDirectionDeg: number;
    seaTemperatureC: number;
    seaStateDescription: string;
  };
  vessels: HistoricalSpillVessel[];
  satelliteSensor: {
    sensorName: string;
    band: string;
    polarization: string;
    resolutionMeters: number;
    passType: string;
    productGranuleId?: string;
  };
  slickPolygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  driftTrajectory: {
    stepHours: number;
    lat: number;
    lng: number;
    slickAreaKm2: number;
    shorelineHit: boolean;
  }[];
  ecologicalImpact: {
    mangroveRisk: 'Critical' | 'High' | 'Moderate' | 'Low';
    coralReefRisk: 'Critical' | 'High' | 'Moderate' | 'Low';
    fisheriesClosed: boolean;
    portsAffected: string[];
    summary: string;
    oiledCoastlineKm?: number;
    wildlifeMortalitySummary?: string;
  };
  summary: string;
  fullNarrativeMarkdown: string;
  isAiReconstructed?: boolean;
  officialSource?: string;
  officialReportId?: string;
  officialSourceUrl?: string;
  dataProvenance?: {
    authority: string;
    investigationStatus: 'Official Concluded Investigation' | 'Government Formal Inquiry' | 'UN/IMO Incident Registry' | 'Scientific Peer-Reviewed Dataset';
    verifiedGroundTruth: boolean;
    sensorProductGranule?: string;
    officialCitations?: string[];
    chemicalFingerprintDetail?: string;
    totalEconomicDamageUsd?: string;
  };
}

export interface SurveillanceSector {
  id: string;
  name: string;
  code: string;
  region: 'INDIA' | 'GLOBAL';
  subZone: string;
  stateOrCountry: string;
  coordinates: {
    lat: number;
    lng: number;
    zoom: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  marineTrafficDensity: 'CRITICAL' | 'VERY_HIGH' | 'HIGH' | 'MODERATE';
  primaryRefineriesAndPorts: string[];
  ecologicalSensitivity: 'CRITICAL (Mangroves/Coral/Sanctuary)' | 'HIGH (Fisheries/Coastal Eco)' | 'MODERATE';
  satellitesMonitoring: string[];
  incoisStationId?: string;
  currentRiskLevel: 'ELEVATED' | 'MODERATE' | 'NORMAL' | 'SPILL_DETECTED';
  defaultMetocean: {
    windSpeedMps: number;
    windDirectionDeg: number;
    currentSpeedMps: number;
    currentDirectionDeg: number;
    waveHeightMeters: number;
    seaTempC: number;
    currentName: string;
  };
}

export interface AlertDispatchRecord {
  id: string;
  channel: 'SMS' | 'EMAIL' | 'WEBHOOK' | 'ICG_MARPOL_DISPATCH' | 'AUDIO_BROADCAST';
  recipient: string;
  status: 'DELIVERED' | 'TRANSMITTED' | 'ACKNOWLEDGED' | 'QUEUED';
  sentAt: string;
  messageBody: string;
  carrierReceiptId?: string;
}

export interface EarlyWarningAlert {
  id: string;
  alertCode: string;
  timestamp: string;
  formattedTime: string;
  severity: 'CRITICAL_SPILL' | 'HIGH_ALERT' | 'MEDIUM_ANOMALY' | 'LOW_WATCH';
  targetSector: {
    id: string;
    name: string;
    region: 'INDIA' | 'GLOBAL';
    lat: number;
    lng: number;
    subZone: string;
  };
  satelliteMission: {
    satelliteName: string;
    sensor: string;
    passTime: string;
    orbitType: 'Ascending' | 'Descending';
    resolutionMeters: number;
    polarization: string;
  };
  detectionDetails: {
    slickAreaKm2: number;
    estimatedVolumeTonnes: number;
    estimatedVolumeM3: number;
    confidenceScore: number;
    dampingRatioDb: number;
    contrastRatioDb: number;
    hydrocarbonType: 'Heavy Crude' | 'Bunker Fuel Oil' | 'Refined Diesel/Naphtha' | 'Bilge Sludge';
    suspectVessel?: {
      name: string;
      mmsi: string;
      imo: string;
      flag: string;
      type: string;
      speedKnots: number;
      headingDeg: number;
      distanceFromOriginKm: number;
    };
    metocean: {
      windSpeedMps: number;
      windDirDeg: number;
      currentSpeedMps: number;
      currentDirDeg: number;
      waveHeightMeters: number;
    };
    driftEtaHoursToShore: number | null;
    threatenedCoastline: string;
    slickPolygonCoords: [number, number][][];
  };
  dispatches: AlertDispatchRecord[];
  recommendedAction: string;
  icgMaritimeReportMarkdown: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AlertNotificationConfig {
  phoneNumber: string;
  email: string;
  webhookUrl: string;
  icgCoastGuardNotify: boolean;
  dgShippingNotify: boolean;
  statePcbNotify: boolean;
  minConfidenceThreshold: number; // e.g. 70
  minAreaThresholdKm2: number; // e.g. 0.2
  autoScanIntervalSeconds: number; // e.g. 20
  autoScanActive: boolean;
  soundAlertEnabled: boolean;
  browserPushEnabled: boolean;
  monitoredRegions: ('INDIA' | 'GLOBAL')[];
}

export interface OperatorProfile {
  id: string;
  name: string;
  organization: string;
  stationId: string;
  email: string;
  phoneNumber: string;
  role: 'Chief Incident Commander' | 'Watchstander / Duty Officer' | 'Satellite SAR Specialist' | 'Environmental Response Coordinator' | 'Port Controller';
  loginTimestamp: string;
  badgeNumber?: string;
  isCustomGuest?: boolean;
}

export interface AuditActionLog {
  id: string;
  operatorName: string;
  operatorEmail: string;
  operatorOrg: string;
  actionType:
    | 'USER_LOGIN'
    | 'ALERT_VIEWED'
    | 'SMS_DISPATCH'
    | 'EMAIL_DISPATCH'
    | 'SATELLITE_NAVTEX_BROADCAST'
    | 'SECTOR_SWEEP_TRIGGERED'
    | 'ALERT_ACKNOWLEDGED'
    | 'CONTACT_DISPATCH_SUBMITTED'
    | 'RADIO_COMMUNICATION'
    | 'SPILL_CONTAINMENT_EXECUTION'
    | 'V2V_CONTAINER_SPILL_BROADCAST'
    | 'V2V_CONTAINER_RECOVERY_ALL_CLEAR';
  targetIncidentOrSector: string;
  details: string;
  recipientInfo?: string;
  carrierReceiptId?: string;
  satellitePowerTelemetry?: {
    satellite: string;
    uplinkEirpDbw: number;
    frequencyMhz: number;
    beamStatus: string;
  };
  timestamp: string;
  istTimestamp: string;
}

export interface NearestShip {
  mmsi: string;
  name: string;
  callSign: string;
  flag: string;
  type: 'VLCC Crude Tanker' | 'Suezmax Tanker' | 'Bulk Carrier' | 'Container Vessel' | 'ICG Fast Patrol Vessel' | 'Offshore Tug';
  distanceNm: number;
  bearingDeg: number;
  speedKnots: number;
  courseDeg: number;
  lat: number;
  lng: number;
  bridgeReceiverStatus: 'ONLINE' | 'STANDBY' | 'ACKNOWLEDGED';
  lastNavtexRx?: string;
}

export interface NearestCoastalStation {
  stationId: string;
  name: string;
  authority: string;
  vhfChannel: string;
  navtexCode: string;
  distanceNm: number;
  bearingDeg: number;
  status: 'OPERATIONAL' | 'RECEIVING' | 'ACKNOWLEDGED';
}

export interface SatellitePowerBroadcastPayload {
  broadcastId: string;
  alertCode: string;
  sectorName: string;
  satelliteSystem: 'Inmarsat-C SafetyNET' | 'ISRO NavIC S-Band' | 'Iridium GMDSS' | 'VHF AIS Coastal Relay';
  solarPowerOutputKw: number;
  rfUplinkEirpDbw: number;
  navtexFrequencyKhz: number;
  targetShips: NearestShip[];
  targetStations: NearestCoastalStation[];
  navtexMessageText: string;
  timestamp: string;
  deliveryStatus: 'BROADCAST_CONFIRMED' | 'TRANSMITTING' | 'QUEUED';
  receiptToken: string;
  dispatcherName?: string;
}

