/**
 * Types for Ship-to-Ship (V2V) Bridge Intercom and Incident Resolution Coordination
 */

export type VesselRole = 'CASUALTY' | 'ASSISTING_RESPONDER' | 'ESCORT_TUG' | 'LIGHTERING_TANKER' | 'COAST_GUARD' | 'PASSING_TRAFFIC';

export interface PhysicsAttributionScore {
  shipId: string;
  shipName: string;
  mmsi: string;
  kelvinWakeMatchPercent: number;
  sarBraggDampingDb: number;
  reverseDriftDistanceMeters: number;
  wavePhaseCoherence: number;
  attributionProbability: number;
  isIdentifiedCulprit: boolean;
  verdict: 'CONFIRMED_POLLUTER' | 'EXONERATED';
  evidenceDetails: string;
}

export interface HydrodynamicWaveState {
  waveDirectionDeg: number;
  waveSignificantHeightMeters: number;
  wavePeriodSeconds: number;
  surfaceCurrentKnots: number;
  stokesDriftKnots: number;
  windSpeedKnots: number;
  windDirectionDeg: number;
}

export interface FloatingHazardItem {
  id: string;
  serialNumber: string;
  hazardType: 'HAZMAT_CONTAINER' | 'HEAVY_CRUDE_OIL_SPILL' | 'FUEL_TANK_POD';
  coordinates: {
    lat: number;
    lng: number;
  };
  canvasPos: {
    x: number;
    y: number;
  };
  droppedByVesselId: string;
  droppedByVesselName: string;
  spillVolumeTonnes: number;
  slickRadiusMeters: number;
  status: 'FLOATING_ACTIVE_SPILL' | 'BEING_INTERCEPTED' | 'RECOVERED_SECURED';
  droppedTimestamp: string;
  recoveredByVesselId?: string;
  recoveredByVesselName?: string;
  recoveredTimestamp?: string;
  broadcastSent: boolean;
  clearanceBroadcastSent: boolean;
  physicsAttributionResults?: PhysicsAttributionScore[];
  isAttributedViaPhysics?: boolean;
  // Hydrodynamic Angle Telemetry
  shipHeadingAtDropDeg?: number;
  sternWakeAngleDeg?: number;
  kelvinHalfAngleDeg?: number;
  bearingToSlickDeg?: number;
  angularOffsetDeg?: number;
  exactCoordinatesFormatted?: string;
  occurredTimestampFormatted?: string;
  spillIndex?: number;
}

export interface FairwayTrafficShip {
  id: string;
  name: string;
  callsign: string;
  mmsi: string;
  type: 'CONTAINER_SHIP' | 'COAST_GUARD_CUTTER' | 'CRUDE_TANKER' | 'SALVAGE_TUG';
  role: 'CASUALTY' | 'RESPONDER' | 'PASSING_VESSEL';
  color: string;
  pos: { x: number; y: number };
  targetPos: { x: number; y: number };
  originalRouteWaypoint: { x: number; y: number };
  speedKnots: number;
  headingDeg: number;
  status: 'CRUISING' | 'PASSING' | 'CONTAINER_DROPPED' | 'TURNING_BACK' | 'INTERCEPTING_HAZARD' | 'RETRIEVING_CONTAINER' | 'ROUTE_RESUMED';
  containersOnBoard: number;
  oilStorageTonnes: number;
  hasDroppedHazard: boolean;
  retrievedHazardCount: number;
  // Vessel Visual & Real Dimensions
  photoUrl?: string;
  lengthMeters?: number;
  beamMeters?: number;
  draughtMeters?: number;
  cargoDescription?: string;
}

export interface V2VVessel {
  id: string;
  name: string;
  callsign: string;
  mmsi: string;
  imo: string;
  flag: string;
  vesselType: 'CONTAINER_CARRIER' | 'CRUDE_TANKER' | 'POLLUTION_RESPONSE_VESSEL' | 'ESCORT_TUG' | 'CHEMICAL_CARRIER';
  role: VesselRole;
  captainName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  headingDeg: number;
  speedKnots: number;
  distanceNmToCasualty: number;
  bearingDegToCasualty: number;
  vhfChannel: number;
  dscStatus: 'CARRIER_LOCKED' | 'ONLINE' | 'STANDBY';
  equipmentOnBoard: {
    boomLengthMeters: number;
    skimmerCapacityM3h: number;
    stsTransferHoses: boolean;
    pneumaticFenders: number;
    dispersantLitres: number;
    oilStorageCapacityM3: number;
  };
  hullStatus: {
    leakSource?: string;
    cargoOrFuelType?: string;
    remainingTonnesAtRisk?: number;
    initialSpillVolumeTonnes: number;
    currentOutflowRateM3h: number;
    listDegrees: number;
    containmentProgressPct: number;
    activeAction: string;
  };
}

export interface RadioMessage {
  id: string;
  timestamp: string;
  istTime: string;
  senderVesselId: string;
  senderVesselName: string;
  senderRole: VesselRole;
  senderRank: string;
  vhfChannel: number;
  audioFrequencyMhz: number;
  messageText: string;
  messageType: 'DISTRESS_MAYDAY' | 'SECURITY_PAN' | 'TACTICAL_COORDINATION' | 'STS_TRANSFER' | 'BOOM_DEPLOYMENT' | 'SKIMMER_OPS' | 'CLEAN_VERIFICATION';
  urgent: boolean;
}

export interface ResolutionPhase {
  id: number;
  code: string;
  title: string;
  description: string;
  requiredVessels: string[];
  equipmentRequired: string;
  reductionPercentage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  completedBy?: string;
  telemetryLog?: string;
}

export interface ShipCoordinationScenario {
  id: string;
  title: string;
  locationName: string;
  incidentType: string;
  initialSpillTonnes: number;
  hydrocarbonType: string;
  seaConditions: string;
  casualtyVessel: V2VVessel;
  nearbyVessels: V2VVessel[];
  phases: ResolutionPhase[];
}

export interface NearbyPortOrOilStation {
  id: string;
  name: string;
  stationType: 'MARINE_OIL_TERMINAL' | 'PORT_HARBOR' | 'COAST_GUARD_BASE' | 'CRUDE_OFFSHORE_BERTH';
  authority: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  canvasPos: {
    x: number;
    y: number;
  };
  vhfChannel: number;
  phoneHotline: string;
  callSign: string;
  responseReadiness: 'READY_IMMEDIATE' | 'STANDBY_15MIN' | 'DEPLOYED';
  tierLevel: 'Tier-1 Immediate' | 'Tier-2 Regional' | 'Tier-3 National';
  skimmerBoatsAvailable: number;
  boomLengthMeters: number;
  dispersantTonnes: number;
  distanceNm?: number;
  bearingDeg?: number;
}

export interface SpillConsignmentOrder {
  consignmentId: string; // e.g. CONSIGN-OSPR-2026-8841
  status: 'DISPATCHED_TO_STATION' | 'ASSIGNED_FOR_PICKUP' | 'PICKUP_IN_PROGRESS' | 'RECOVERED_SECURED' | 'CLOSED_ALL_CLEAR';
  spillHazardId: string;
  sourceVessel: {
    name: string;
    mmsi: string;
    callsign: string;
    flag: string;
  };
  nearestStation: {
    id: string;
    name: string;
    stationType: string;
    authority: string;
    distanceNm: number;
    vhfChannel: number;
    phoneHotline: string;
  };
  exactCoordinatesFormatted: string;
  occurredTimestampFormatted: string;
  spillVolumeTonnes: number;
  assignedPickupResponder: {
    id: string;
    name: string;
    type: string;
  };
  dispatchedTimestamp: string;
  pickupDetectedAt?: string;
  recoveredByVesselName?: string;
  clearanceBroadcastSent: boolean;
  marpolReference: string;
  chainOfCustodyToken: string;
  officialNotes: string;
}

export interface UniversalClearanceBroadcast {
  broadcastId: string;
  timestamp: string;
  consignmentId: string;
  recoveringVesselName: string;
  clearedSlickCoordinates: string;
  nearestStationName: string;
  clearedSpillVolumeTonnes: number;
  channelsAnnounced: {
    dscCh70AllStations: boolean;
    vhfCh16MaydaySecuriteCancel: boolean;
    directStationTelemetryAck: boolean;
    v2vPassingFairwayTraffic: boolean;
  };
  broadcastSummary: string;
}
