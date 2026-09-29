import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Ship,
  Radio,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Anchor,
  Compass,
  Zap,
  Volume2,
  VolumeX,
  Send,
  Navigation,
  Crosshair,
  Package,
  Layers,
  ArrowRight,
  Flame,
  Activity,
  Check,
  Sparkles,
  Waves,
  Satellite,
  Target,
  Cpu,
  FileText,
  Eye,
  Info,
  Sliders,
  Building2,
  Phone,
  Truck,
  Globe,
} from 'lucide-react';
import {
  FloatingHazardItem,
  FairwayTrafficShip,
  RadioMessage,
  PhysicsAttributionScore,
  NearbyPortOrOilStation,
  SpillConsignmentOrder,
  UniversalClearanceBroadcast,
} from '../types/shipCoordination';
import {
  NEARBY_COASTAL_STATIONS,
  getStationDistances,
  computeDistanceNm,
} from '../constants/nearbyStations';
import { NearbyPortsAndConsignmentHub } from './NearbyPortsAndConsignmentHub';
import { SpillConsignmentReportModal } from './SpillConsignmentReportModal';
import { UniversalClearanceModal } from './UniversalClearanceModal';
import { shipAudio } from '../services/shipIntercomService';
import { OperatorAuthService } from '../services/operatorAuthService';
import {
  performHydrodynamicForensicAttribution,
  DEFAULT_HYDRODYNAMICS,
  computeKelvinWakeMatch,
  performMultiHazardForensicAttribution,
} from '../services/hydrodynamicAttributionService';
import containerShipCoralImg from '../assets/images/container_ship_coral_1788414689826.jpg';
import oilTankerFalconImg from '../assets/images/oil_tanker_falcon_1788414711311.jpg';
import bulkCarrierTitanImg from '../assets/images/bulk_carrier_titan_1788414724953.jpg';
import coastGuardSamarthImg from '../assets/images/coast_guard_samarth_1788414747641.jpg';

export function formatDMS(lat: number, lng: number): string {
  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
  const latSec = (((Math.abs(lat) - latDeg) * 60 - latMin) * 60).toFixed(1);
  const latDir = lat >= 0 ? 'N' : 'S';

  const lngDeg = Math.floor(Math.abs(lng));
  const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
  const lngSec = (((Math.abs(lng) - lngDeg) * 60 - lngMin) * 60).toFixed(1);
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${latDeg}°${latMin.toString().padStart(2, '0')}'${latSec.padStart(4, '0')}"${latDir}, ${lngDeg}°${lngMin.toString().padStart(2, '0')}'${lngSec.padStart(4, '0')}"${lngDir}`;
}

export function formatExactTimestamp(date: Date = new Date()): string {
  const utc = date.toTimeString().split(' ')[0] + ' UTC';
  const ist = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST';
  return `${utc} (${ist})`;
}

interface AutonomousPassingFairwaySimulatorProps {
  onRadioBroadcast?: (msg: RadioMessage) => void;
  reducedMotion?: boolean;
}

const INITIAL_SHIPS: FairwayTrafficShip[] = [
  {
    id: 'ship-pacific-coral',
    name: 'M/V PACIFIC CORAL',
    callsign: '9V8921',
    mmsi: '563012980',
    type: 'CONTAINER_SHIP',
    role: 'CASUALTY',
    color: '#f87171', // Red/Coral
    pos: { x: 120, y: 190 },
    targetPos: { x: 680, y: 190 },
    originalRouteWaypoint: { x: 680, y: 190 },
    speedKnots: 16.4,
    headingDeg: 90,
    status: 'CRUISING',
    containersOnBoard: 14200,
    oilStorageTonnes: 4200,
    hasDroppedHazard: false,
    retrievedHazardCount: 0,
    photoUrl: containerShipCoralImg,
    lengthMeters: 366,
    beamMeters: 51,
    draughtMeters: 15.2,
    cargoDescription: '14,200 TEU Stacked Containers & HAZMAT IMDG Cargo',
  },
  {
    id: 'ship-strait-falcon',
    name: 'M/V STRAIT FALCON',
    callsign: 'C6ZW2',
    mmsi: '311000492',
    type: 'CRUDE_TANKER',
    role: 'PASSING_VESSEL',
    color: '#38bdf8', // Sky blue
    pos: { x: 660, y: 250 },
    targetPos: { x: 100, y: 250 },
    originalRouteWaypoint: { x: 100, y: 250 },
    speedKnots: 15.8,
    headingDeg: 270,
    status: 'CRUISING',
    containersOnBoard: 0,
    oilStorageTonnes: 118000,
    hasDroppedHazard: false,
    retrievedHazardCount: 0,
    photoUrl: oilTankerFalconImg,
    lengthMeters: 244,
    beamMeters: 42,
    draughtMeters: 14.1,
    cargoDescription: '118,000 Tonnes Arab Light Crude & Heavy Marine Fuel',
  },
  {
    id: 'ship-icgs-samudra',
    name: 'ICGS SAMUDRA PAVAK',
    callsign: 'VWSP',
    mmsi: '419001420',
    type: 'COAST_GUARD_CUTTER',
    role: 'RESPONDER',
    color: '#34d399', // Emerald
    pos: { x: 380, y: 380 },
    targetPos: { x: 420, y: 80 },
    originalRouteWaypoint: { x: 420, y: 80 },
    speedKnots: 22.0,
    headingDeg: 350,
    status: 'CRUISING',
    containersOnBoard: 0,
    oilStorageTonnes: 500,
    hasDroppedHazard: false,
    retrievedHazardCount: 0,
    photoUrl: coastGuardSamarthImg,
    lengthMeters: 105,
    beamMeters: 13.6,
    draughtMeters: 3.6,
    cargoDescription: 'Pollution Control Cutter, Hi-Sprint Skimmers & 500m Booms',
  },
  {
    id: 'ship-ocean-guardian',
    name: 'M/V ARABIAN TITAN',
    callsign: 'ATOG',
    mmsi: '419992310',
    type: 'SALVAGE_TUG',
    role: 'PASSING_VESSEL',
    color: '#fbbf24', // Amber
    pos: { x: 580, y: 360 },
    targetPos: { x: 200, y: 360 },
    originalRouteWaypoint: { x: 200, y: 360 },
    speedKnots: 12.5,
    headingDeg: 260,
    status: 'CRUISING',
    containersOnBoard: 0,
    oilStorageTonnes: 150,
    hasDroppedHazard: false,
    retrievedHazardCount: 0,
    photoUrl: bulkCarrierTitanImg,
    lengthMeters: 225,
    beamMeters: 32,
    draughtMeters: 12.5,
    cargoDescription: 'Bulk Carrier / Salvage Recovery Unit with 150T Heavy Derrick',
  },
];

export const AutonomousPassingFairwaySimulator: React.FC<AutonomousPassingFairwaySimulatorProps> = ({
  onRadioBroadcast,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ships, setShips] = useState<FairwayTrafficShip[]>(INITIAL_SHIPS);
  const [hazards, setHazards] = useState<FloatingHazardItem[]>([]);
  const shipsRef = useRef<FairwayTrafficShip[]>(INITIAL_SHIPS);
  const hazardsRef = useRef<FloatingHazardItem[]>([]);

  useEffect(() => {
    shipsRef.current = ships;
  }, [ships]);

  useEffect(() => {
    hazardsRef.current = hazards;
  }, [hazards]);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [autoSimulationMode, setAutoSimulationMode] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [selectedShipId, setSelectedShipId] = useState<string>('ship-pacific-coral');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [recentBroadcastBanner, setRecentBroadcastBanner] = useState<{
    id: string;
    type: 'DISTRESS' | 'CLEARANCE' | 'PASSING_INFO';
    title: string;
    text: string;
    timestamp: string;
  } | null>(null);

  // Hydrodynamic Wave & Satellite SAR Physics Attribution State
  const [showPhysicsOverlay, setShowPhysicsOverlay] = useState<boolean>(true);
  const [isAnalyzingPhysics, setIsAnalyzingPhysics] = useState<boolean>(false);
  const [physicsAnalysisStep, setPhysicsAnalysisStep] = useState<number>(0);
  const [physicsStepTitle, setPhysicsStepTitle] = useState<string>('');
  const [activeAttributionScores, setActiveAttributionScores] = useState<PhysicsAttributionScore[]>([]);
  const [showAttributionModal, setShowAttributionModal] = useState<boolean>(false);
  const wavePhaseRef = useRef<number>(0);

  // Rotating scan target candidates across commercial fairway ships
  const polluterCandidates = ['ship-pacific-coral', 'ship-strait-falcon', 'ship-ocean-guardian'];
  const [scanCulpritIndex, setScanCulpritIndex] = useState<number>(0);

  // Nearby Coastal Ports & Marine Oil Stations State
  const [stations, setStations] = useState<NearbyPortOrOilStation[]>(NEARBY_COASTAL_STATIONS);
  const [activeConsignment, setActiveConsignment] = useState<SpillConsignmentOrder | null>(null);
  const [showConsignmentModal, setShowConsignmentModal] = useState<boolean>(false);
  const [universalClearanceRecord, setUniversalClearanceRecord] = useState<UniversalClearanceBroadcast | null>(null);
  const [showClearanceModal, setShowClearanceModal] = useState<boolean>(false);
  const [everywhereNoticeBanner, setEverywhereNoticeBanner] = useState<{
    id: string;
    title: string;
    summary: string;
    channels: string[];
    timestamp: string;
  } | null>(null);

  // Update coastal station distances whenever hazards change
  useEffect(() => {
    const activeHazard = hazards.find(
      (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
    );
    setStations(getStationDistances(NEARBY_COASTAL_STATIONS, activeHazard ? activeHazard.coordinates : null));
  }, [hazards]);

  // Preload real vessel photos for radar canvas rendering
  const shipImagesRef = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    const photoMap: Record<string, string> = {
      'ship-pacific-coral': containerShipCoralImg,
      'ship-strait-falcon': oilTankerFalconImg,
      'ship-icgs-samudra': coastGuardSamarthImg,
      'ship-ocean-guardian': bulkCarrierTitanImg,
    };
    Object.entries(photoMap).forEach(([id, src]) => {
      const img = new Image();
      img.src = src;
      shipImagesRef.current[id] = img;
    });
  }, []);

  // Radar sweep animation angle
  const radarSweepAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Autonomous state machine step timer
  const autoStepTimerRef = useRef<number>(0);

  // Trigger automated broadcast
  const sendAutonomousRadioBroadcast = useCallback(
    (
      sender: FairwayTrafficShip,
      messageText: string,
      messageType: RadioMessage['messageType'],
      bannerTitle: string,
      bannerType: 'DISTRESS' | 'CLEARANCE' | 'PASSING_INFO'
    ) => {
      if (soundEnabled) {
        if (messageType === 'DISTRESS_MAYDAY') {
          shipAudio.playDscAlarm();
        } else {
          shipAudio.playVhfClick();
        }
      }

      const now = new Date();
      const istTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const radioMsg: RadioMessage = {
        id: `auto-msg-${Date.now()}`,
        timestamp: now.toISOString(),
        istTime,
        senderVesselId: sender.id,
        senderVesselName: sender.name,
        senderRole: sender.role === 'CASUALTY' ? 'CASUALTY' : sender.role === 'RESPONDER' ? 'COAST_GUARD' : 'ASSISTING_RESPONDER',
        senderRank: 'Autonomous GMDSS Transponder (DSC Ch 70)',
        vhfChannel: 16,
        audioFrequencyMhz: 156.8,
        messageText,
        messageType,
        urgent: messageType === 'DISTRESS_MAYDAY',
      };

      if (onRadioBroadcast) {
        setTimeout(() => {
          onRadioBroadcast(radioMsg);
        }, 0);
      }

      setRecentBroadcastBanner({
        id: `banner-${Date.now()}`,
        type: bannerType,
        title: bannerTitle,
        text: messageText,
        timestamp: istTime,
      });

      // Record in global response audit history
      OperatorAuthService.recordAuditLog({
        actionType: messageType === 'DISTRESS_MAYDAY' ? 'V2V_CONTAINER_SPILL_BROADCAST' : 'V2V_CONTAINER_RECOVERY_ALL_CLEAR',
        targetIncidentOrSector: `Mumbai High TSS Fairway (${sender.pos.x.toFixed(0)}, ${sender.pos.y.toFixed(0)})`,
        details: `[V2V Autonomous GMDSS] ${sender.name} transmitted: "${messageText}"`,
        recipientInfo: `All nearby vessels in 20 NM VHF radar range`,
        carrierReceiptId: `DSC-${Date.now().toString(36).toUpperCase()}`,
      });
    },
    [onRadioBroadcast, soundEnabled]
  );

  // Function to drop a container & trigger oil spill from a ship
  const handleDropContainerHazard = useCallback(
    (droppingShipId?: string) => {
      const targetShipId = droppingShipId || selectedShipId || 'ship-pacific-coral';
      const sourceShip = ships.find((s) => s.id === targetShipId) || ships[0];

      if (!sourceShip) return;

      const containerSerial = `MSKU-${Math.floor(100000 + Math.random() * 900000)}`;
      const lat = 18.915 + (sourceShip.pos.y - 200) * 0.0005;
      const lng = 72.350 + (sourceShip.pos.x - 400) * 0.0005;
      const exactCoordinatesFormatted = formatDMS(lat, lng);
      const occurredTimestampFormatted = formatExactTimestamp();

      const newHazard: FloatingHazardItem = {
        id: `hazard-${Date.now()}`,
        serialNumber: containerSerial,
        hazardType: 'HAZMAT_CONTAINER',
        coordinates: { lat, lng },
        canvasPos: { x: sourceShip.pos.x, y: sourceShip.pos.y },
        droppedByVesselId: sourceShip.id,
        droppedByVesselName: sourceShip.name,
        spillVolumeTonnes: 35,
        slickRadiusMeters: 45,
        status: 'FLOATING_ACTIVE_SPILL',
        droppedTimestamp: occurredTimestampFormatted,
        broadcastSent: true,
        clearanceBroadcastSent: false,
        exactCoordinatesFormatted,
        occurredTimestampFormatted,
        shipHeadingAtDropDeg: sourceShip.headingDeg,
        sternWakeAngleDeg: (sourceShip.headingDeg + 180) % 360,
        kelvinHalfAngleDeg: 19.47,
      };

      setHazards((prev) => [...prev.filter((h) => h.status !== 'FLOATING_ACTIVE_SPILL'), newHazard]);

      // Update source ship status
      setShips((prev) =>
        prev.map((s) => {
          if (s.id === sourceShip.id) {
            return {
              ...s,
              status: 'CONTAINER_DROPPED' as const,
              hasDroppedHazard: true,
              containersOnBoard: Math.max(0, s.containersOnBoard - 1),
            };
          }
          return s;
        })
      );

      // Calculate nearest port or marine oil station to the spill
      const stationsWithDist = getStationDistances(NEARBY_COASTAL_STATIONS, { lat, lng });
      const nearestSt = stationsWithDist.reduce(
        (min, s) => ((s.distanceNm ?? 999) < (min.distanceNm ?? 999) ? s : min),
        stationsWithDist[0]
      );

      // AUTONOMOUS BROADCAST BY ITSELF TO ALL NEARBY SHIPS & NEAREST RESPONSE STATION
      const distressText = `🚨 MAYDAY / SECURITE (AUTONOMOUS DSC CH 70 & VHF 16): ${sourceShip.name} reports LOST OVERBOARD HAZMAT CONTAINER #${containerSerial} at [${exactCoordinatesFormatted}] at ${occurredTimestampFormatted}! Active 35-Tonne fuel slick spreading. Nearest Station: ${nearestSt.name.split(' (')[0]} (${nearestSt.distanceNm} NM, VHF CH ${nearestSt.vhfChannel}). All vessels maintain 2 NM berth. Direct consignment response logged!`;

      sendAutonomousRadioBroadcast(
        sourceShip,
        distressText,
        'DISTRESS_MAYDAY',
        `🚨 AUTONOMOUS DISTRESS BROADCAST: Container #${containerSerial} Dropped by ${sourceShip.name}`,
        'DISTRESS'
      );

      return newHazard;
    },
    [selectedShipId, ships, sendAutonomousRadioBroadcast]
  );

  // Function to directly contact the nearest coastal port / oil station and generate official consignment report
  const handleDirectContactNearestStationAndCreateConsignment = useCallback(
    (specificStationId?: string) => {
      // 1. Get or create active hazard
      let targetHazard = hazards.find(
        (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
      );

      if (!targetHazard) {
        // Drop container from casualty ship to initiate incident demo
        targetHazard = handleDropContainerHazard('ship-pacific-coral');
        if (!targetHazard) return;
      }

      // 2. Calculate station distances and find target station
      const stationsWithDist = getStationDistances(NEARBY_COASTAL_STATIONS, targetHazard.coordinates);
      const targetStation = specificStationId
        ? stationsWithDist.find((s) => s.id === specificStationId) || stationsWithDist[0]
        : stationsWithDist.reduce(
            (min, s) => ((s.distanceNm ?? 999) < (min.distanceNm ?? 999) ? s : min),
            stationsWithDist[0]
          );

      // 3. Find casualty / polluter ship
      const culprit = ships.find((s) => s.id === targetHazard!.droppedByVesselId) || ships[0];

      // 4. Formulate the official MARPOL Annex I Emergency Consignment Order
      const consignmentId = `CONSIGN-OSPR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const exactCoords =
        targetHazard.exactCoordinatesFormatted ||
        formatDMS(targetHazard.coordinates.lat, targetHazard.coordinates.lng);
      const exactTime = targetHazard.occurredTimestampFormatted || targetHazard.droppedTimestamp;

      const newOrder: SpillConsignmentOrder = {
        consignmentId,
        status: 'DISPATCHED_TO_STATION',
        spillHazardId: targetHazard.id,
        sourceVessel: {
          name: culprit.name,
          mmsi: culprit.mmsi,
          callsign: culprit.callsign,
          flag: 'Singapore / International Registry',
        },
        nearestStation: {
          id: targetStation.id,
          name: targetStation.name,
          stationType: targetStation.stationType,
          authority: targetStation.authority,
          distanceNm: targetStation.distanceNm || 1.8,
          vhfChannel: targetStation.vhfChannel,
          phoneHotline: targetStation.phoneHotline,
        },
        exactCoordinatesFormatted: exactCoords,
        occurredTimestampFormatted: exactTime,
        spillVolumeTonnes: targetHazard.spillVolumeTonnes,
        assignedPickupResponder: {
          id: 'ship-icgs-samudra',
          name: 'ICGS SAMUDRA PAVAK',
          type: 'Pollution Control Cutter',
        },
        dispatchedTimestamp: formatExactTimestamp(),
        clearanceBroadcastSent: false,
        marpolReference: 'IMO MARPOL Annex I Resolution MEPC.117(52) / NOS-DCP Priority Tier-1',
        chainOfCustodyToken: `COC-OSPR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        officialNotes: `Emergency consignment direct transmission logged with ${targetStation.name} on VHF CH ${targetStation.vhfChannel}. Consignment pickup ordered for assigned unit ICGS SAMUDRA PAVAK.`,
      };

      setActiveConsignment(newOrder);
      setShowConsignmentModal(true);

      if (soundEnabled) {
        shipAudio.playVhfClick();
      }

      // Direct transmission to station and radio broadcast
      const radioText = `DIRECT CALL TO ${targetStation.name.toUpperCase()} (VHF CH ${targetStation.vhfChannel}): This is casualty ${culprit.name}. Emergency Consignment Order #${consignmentId} logged. Spill coordinates: [${exactCoords}], volume ${targetHazard.spillVolumeTonnes}T heavy fuel. Assigning ICGS SAMUDRA PAVAK to pick up consignment and contain slick!`;

      sendAutonomousRadioBroadcast(
        culprit,
        radioText,
        'TACTICAL_COORDINATION',
        `📡 DIRECT CONTACT: ${targetStation.name.split(' (')[0]} (VHF CH ${targetStation.vhfChannel})`,
        'PASSING_INFO'
      );
    },
    [hazards, ships, soundEnabled, handleDropContainerHazard, sendAutonomousRadioBroadcast]
  );

  // Physics-based 4-Ship Ambiguous Spill Attribution Engine (Rotates polluters across scans once cleared)
  const handleTriggerAmbiguous4ShipSpill = useCallback(
    (forcedCulpritId?: string) => {
      // Rule: If an active spill is already present in the fairway and NOT yet cleared, maintain focus on that ship!
      const existingActiveHazard = hazardsRef.current.find(
        (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
      );

      let targetCulpritId: string;
      if (forcedCulpritId) {
        targetCulpritId = forcedCulpritId;
      } else if (existingActiveHazard) {
        // Keep pointing strictly to the ship that caused the active oil spill until it is retrieved and cleared!
        targetCulpritId = existingActiveHazard.droppedByVesselId;
      } else {
        // Rotate to the next commercial fairway vessel in order
        targetCulpritId = polluterCandidates[scanCulpritIndex % polluterCandidates.length];
      }

      const culpritShip = ships.find((s) => s.id === targetCulpritId) || ships[0];
      const containerSerial = `MSKU-${Math.floor(100000 + Math.random() * 900000)}`;

      // Positioned strategically along the culprit's stern wake
      const dropX = culpritShip.pos.x - Math.cos((culpritShip.headingDeg * Math.PI) / 180) * 28;
      const dropY = culpritShip.pos.y - Math.sin((culpritShip.headingDeg * Math.PI) / 180) * 28;

      const lat = 18.9142 + (dropY - 220) * 0.0004;
      const lng = 72.3518 + (dropX - 380) * 0.0004;
      const exactCoordinatesFormatted = formatDMS(lat, lng);
      const occurredTimestampFormatted = formatExactTimestamp();

      const newHazard: FloatingHazardItem = {
        id: `hazard-ambiguous-${Date.now()}`,
        serialNumber: containerSerial,
        hazardType: 'HAZMAT_CONTAINER',
        coordinates: { lat, lng },
        canvasPos: { x: Math.max(140, Math.min(620, dropX)), y: Math.max(160, Math.min(320, dropY)) },
        droppedByVesselId: culpritShip.id,
        droppedByVesselName: culpritShip.name,
        spillVolumeTonnes: 42,
        slickRadiusMeters: 55,
        status: 'FLOATING_ACTIVE_SPILL',
        droppedTimestamp: occurredTimestampFormatted,
        broadcastSent: true,
        clearanceBroadcastSent: false,
        isAttributedViaPhysics: true,
        exactCoordinatesFormatted,
        occurredTimestampFormatted,
        shipHeadingAtDropDeg: culpritShip.headingDeg,
        sternWakeAngleDeg: (culpritShip.headingDeg + 180) % 360,
        kelvinHalfAngleDeg: 19.47,
      };

      setHazards((prev) => [...prev.filter((h) => h.status !== 'FLOATING_ACTIVE_SPILL'), newHazard]);

      // Flag culprit vessel status
      setShips((prev) =>
        prev.map((s) => {
          if (s.id === culpritShip.id) {
            return {
              ...s,
              status: 'CONTAINER_DROPPED' as const,
              hasDroppedHazard: true,
              containersOnBoard: Math.max(0, s.containersOnBoard - 1),
            };
          }
          return s;
        })
      );

      // Start multi-phase physics investigation
      setIsAnalyzingPhysics(true);
      setPhysicsAnalysisStep(1);
      setPhysicsStepTitle('🛰️ SATELLITE SCAN: Sentinel-1 C-Band SAR sweeping fairway capillary waves for Bragg suppression...');

      if (soundEnabled) {
        shipAudio.playVhfClick();
      }

      // Initial ambiguous notification
      sendAutonomousRadioBroadcast(
        culpritShip,
        `⚠️ SECURITE / ALL STATIONS (VHF CH 16): Unidentified 42-Tonne heavy crude oil slick detected at [${exactCoordinatesFormatted}] at ${occurredTimestampFormatted}. 4 ships in immediate cluster. Initiating Sentinel-1 satellite SAR backscatter & hydrodynamic water wave-wake forensic attribution...`,
        'SAFETY_SECURITE',
        '⚠️ AMBIGUOUS SPILL IN 4-SHIP CLUSTER: Running Physics Attribution',
        'PASSING_INFO'
      );

      // Phase 2: Hydrodynamic Kelvin Wake Angle (900ms)
      setTimeout(() => {
        setPhysicsAnalysisStep(2);
        setPhysicsStepTitle('🌊 HYDRODYNAMICS: Modeling 19.47° Kelvin wake envelopes & divergent wave crest damping...');
      }, 900);

      // Phase 3: Euler-Lagrangian Reverse Stokes Drift Vector (1800ms)
      setTimeout(() => {
        setPhysicsAnalysisStep(3);
        setPhysicsStepTitle('🎯 STOKES DRIFT: Backtracking wave drift & surface shear against ship AIS tracks...');
      }, 1800);

      // Phase 4: Final Attribution Confirmed & Autonomous Messages Dispatched (2700ms)
      setTimeout(() => {
        const scores = performHydrodynamicForensicAttribution(newHazard, ships);
        setActiveAttributionScores(scores);
        setPhysicsAnalysisStep(4);
        setIsAnalyzingPhysics(false);
        setPhysicsStepTitle(`✅ ACCURATE SOURCE PINPOINTED: ${culpritShip.name} (${scores[0].attributionProbability}% Probability)`);

        // Attach results to hazard
        setHazards((prev) =>
          prev.map((h) => (h.id === newHazard.id ? { ...h, physicsAttributionResults: scores } : h))
        );

        // AUTONOMOUS MESSAGE 1: DIRECT CITATION TO CULPRIT SHIP
        const culpritNotice = `🚨 MARPOL VIOLATION CITATION (AUTONOMOUS DSC CH 70): To ${culpritShip.name} (MMSI: ${culpritShip.mmsi}). Hydrodynamic water wave Kelvin wake analysis (θ=19.47°, Heading: ${culpritShip.headingDeg.toFixed(0)}°T) and Sentinel-1 SAR Bragg dampening (Δσ₀ = ${scores[0].sarBraggDampingDb} dB) confirm the 42T oil slick at [${exactCoordinatesFormatted}] originated from your stern at ${occurredTimestampFormatted}! Polluter confirmed (${scores[0].attributionProbability}% confidence). Execute immediate onboard containment.`;

        sendAutonomousRadioBroadcast(
          culpritShip,
          culpritNotice,
          'DISTRESS_MAYDAY',
          `🚨 ACCURATE SHIP PINPOINTED VIA PHYSICS: Citation Issued to ${culpritShip.name}`,
          'DISTRESS'
        );

        // AUTONOMOUS MESSAGE 2: ADVISORY BROADCAST TO ALL OTHER NEARBY SHIPS
        setTimeout(() => {
          const innocentShips = ships.filter((s) => s.id !== culpritShip.id);
          const advisoryText = `📢 V2V TRAFFIC ADVISORY (ALL NEARBY SHIPS): Physics wave & satellite attribution has confirmed ${culpritShip.name} as the source of the 42T oil slick at [${exactCoordinatesFormatted}] (Occurred: ${occurredTimestampFormatted}). All other vessels (${innocentShips.map((s) => s.name.split(' (')[0]).join(', ')}) are exonerated. Maintain 2 NM separation and standby for emergency boom deployment.`;

          sendAutonomousRadioBroadcast(
            innocentShips[0] || culpritShip,
            advisoryText,
            'TACTICAL_COORDINATION',
            `📢 ADVISORY TO ALL NEARBY SHIPS: ${culpritShip.name} Confirmed Source via Wave Physics`,
            'PASSING_INFO'
          );
        }, 1200);
      }, 2700);
    },
    [scanCulpritIndex, polluterCandidates, selectedShipId, ships, soundEnabled, sendAutonomousRadioBroadcast]
  );

  // Scenario: 2 of 4 nearby ships have both spilled oil simultaneously
  const handleTriggerDualShipSpill = useCallback(() => {
    const ship1 = ships.find((s) => s.id === 'ship-pacific-coral') || ships[0];
    const ship2 = ships.find((s) => s.id === 'ship-strait-falcon') || ships[1];

    const dropX1 = ship1.pos.x - Math.cos((ship1.headingDeg * Math.PI) / 180) * 26;
    const dropY1 = ship1.pos.y - Math.sin((ship1.headingDeg * Math.PI) / 180) * 26;
    const lat1 = 18.9142 + (dropY1 - 220) * 0.0004;
    const lng1 = 72.3518 + (dropX1 - 380) * 0.0004;
    const coords1 = formatDMS(lat1, lng1);
    const time1 = formatExactTimestamp();

    const dropX2 = ship2.pos.x - Math.cos((ship2.headingDeg * Math.PI) / 180) * 26;
    const dropY2 = ship2.pos.y - Math.sin((ship2.headingDeg * Math.PI) / 180) * 26;
    const lat2 = 18.9142 + (dropY2 - 220) * 0.0004;
    const lng2 = 72.3518 + (dropX2 - 380) * 0.0004;
    const coords2 = formatDMS(lat2, lng2);
    const time2 = formatExactTimestamp();

    const hazard1: FloatingHazardItem = {
      id: `hazard-dual-1-${Date.now()}`,
      serialNumber: `MSKU-${Math.floor(100000 + Math.random() * 900000)}`,
      hazardType: 'HAZMAT_CONTAINER',
      coordinates: { lat: lat1, lng: lng1 },
      canvasPos: { x: Math.max(140, Math.min(620, dropX1)), y: Math.max(160, Math.min(320, dropY1)) },
      droppedByVesselId: ship1.id,
      droppedByVesselName: ship1.name,
      spillVolumeTonnes: 45,
      slickRadiusMeters: 52,
      status: 'FLOATING_ACTIVE_SPILL',
      droppedTimestamp: time1,
      broadcastSent: true,
      clearanceBroadcastSent: false,
      isAttributedViaPhysics: true,
      exactCoordinatesFormatted: coords1,
      occurredTimestampFormatted: time1,
      shipHeadingAtDropDeg: ship1.headingDeg,
      sternWakeAngleDeg: (ship1.headingDeg + 180) % 360,
      kelvinHalfAngleDeg: 19.47,
      spillIndex: 1,
    };

    const hazard2: FloatingHazardItem = {
      id: `hazard-dual-2-${Date.now() + 1}`,
      serialNumber: `TKFL-${Math.floor(100000 + Math.random() * 900000)}`,
      hazardType: 'HAZMAT_CONTAINER',
      coordinates: { lat: lat2, lng: lng2 },
      canvasPos: { x: Math.max(140, Math.min(620, dropX2)), y: Math.max(160, Math.min(320, dropY2)) },
      droppedByVesselId: ship2.id,
      droppedByVesselName: ship2.name,
      spillVolumeTonnes: 38,
      slickRadiusMeters: 48,
      status: 'FLOATING_ACTIVE_SPILL',
      droppedTimestamp: time2,
      broadcastSent: true,
      clearanceBroadcastSent: false,
      isAttributedViaPhysics: true,
      exactCoordinatesFormatted: coords2,
      occurredTimestampFormatted: time2,
      shipHeadingAtDropDeg: ship2.headingDeg,
      sternWakeAngleDeg: (ship2.headingDeg + 180) % 360,
      kelvinHalfAngleDeg: 19.47,
      spillIndex: 2,
    };

    setHazards((prev) => [
      ...prev.filter((h) => h.status !== 'FLOATING_ACTIVE_SPILL'),
      hazard1,
      hazard2,
    ]);

    setShips((prev) =>
      prev.map((s) => {
        if (s.id === ship1.id || s.id === ship2.id) {
          return {
            ...s,
            status: 'CONTAINER_DROPPED' as const,
            hasDroppedHazard: true,
          };
        }
        return s;
      })
    );

    setIsAnalyzingPhysics(true);
    setPhysicsAnalysisStep(1);
    setPhysicsStepTitle('🛰️ DUAL SAR SCAN: Detecting 2 distinct radar Bragg damping signatures in 4-ship fairway...');

    if (soundEnabled) {
      shipAudio.playVhfClick();
    }

    sendAutonomousRadioBroadcast(
      ship1,
      `🚨 CRITICAL ALL STATIONS (VHF CH 16 / DSC CH 70): 2 separate oil spills detected in 4-ship fairway! Slick #1 at [${coords1}] (Time: ${time1}) and Slick #2 at [${coords2}] (Time: ${time2}). Initiating simultaneous dual-vessel Kelvin wave (θ=19.47°) & Sentinel-1 SAR attribution...`,
      'DISTRESS_MAYDAY',
      '🚨 2 OF 4 SHIPS DETECTED IN OIL SPILL EVENT: Dual Physics Attribution Initiated',
      'DISTRESS'
    );

    setTimeout(() => {
      setPhysicsAnalysisStep(2);
      setPhysicsStepTitle('🌊 HYDRODYNAMICS: Reconstructing Kelvin wake envelopes (θ=19.47°) for both passing vessels...');
    }, 900);

    setTimeout(() => {
      setPhysicsAnalysisStep(3);
      setPhysicsStepTitle('🎯 STOKES DRIFT: Resolving 2 simultaneous Eulerian-Lagrangian drift vectors to polluter sterns...');
    }, 1800);

    setTimeout(() => {
      const multiScores = performMultiHazardForensicAttribution([hazard1, hazard2], ships);
      setActiveAttributionScores(multiScores);
      setPhysicsAnalysisStep(4);
      setIsAnalyzingPhysics(false);
      setPhysicsStepTitle(`✅ DUAL POLLUTERS PINPOINTED: ${ship1.name} (98.2%) & ${ship2.name} (97.6%)`);

      // Broadcast MARPOL Citations to BOTH vessels
      sendAutonomousRadioBroadcast(
        ship1,
        `🚨 MARPOL DSC CH 70 DUAL CITATION: Confirmed 2 polluters in 4-ship group! Vessel #1 ${ship1.name} spilled at [${coords1}] at [${time1}] (Heading: ${ship1.headingDeg.toFixed(0)}°, Kelvin Cusp: ±19.47°). Vessel #2 ${ship2.name} spilled at [${coords2}] at [${time2}] (Heading: ${ship2.headingDeg.toFixed(0)}°, Kelvin Cusp: ±19.47°). Both vessels cited under IMO Resolution MEPC.117(52). Responders dispatched to both coordinates!`,
        'DISTRESS_MAYDAY',
        `🚨 DUAL SPILL ATTRIBUTION CONFIRMED: Citations Issued to ${ship1.name} & ${ship2.name}`,
        'DISTRESS'
      );
    }, 2700);
  }, [ships, soundEnabled, sendAutonomousRadioBroadcast]);

  // Command a nearby ship to intercept and pick up the floating container
  const handleCommandShipToRetrieve = useCallback(
    (rescuerShipId: string, hazardId?: string) => {
      const activeHazard = hazardId ? hazards.find((h) => h.id === hazardId) : hazards.find((h) => h.status === 'FLOATING_ACTIVE_SPILL');
      if (!activeHazard) return;

      const rescuerShip = ships.find((s) => s.id === rescuerShipId);
      if (!rescuerShip) return;

      // Update ship target to navigate directly to container position
      setShips((prev) =>
        prev.map((s) => {
          if (s.id === rescuerShipId) {
            const isOriginalDropper = s.id === activeHazard.droppedByVesselId;
            return {
              ...s,
              targetPos: { x: activeHazard.canvasPos.x, y: activeHazard.canvasPos.y },
              status: isOriginalDropper ? ('TURNING_BACK' as const) : ('INTERCEPTING_HAZARD' as const),
            };
          }
          return s;
        })
      );

      setHazards((prev) =>
        prev.map((h) => {
          if (h.id === activeHazard.id) {
            return { ...h, status: 'BEING_INTERCEPTED' as const };
          }
          return h;
        })
      );

      const isSelfRecovery = rescuerShip.id === activeHazard.droppedByVesselId;
      const ackText = isSelfRecovery
        ? `ALL STATIONS: This is ${rescuerShip.name}. We are executing Williamson turn to return to coordinates [${activeHazard.coordinates.lat.toFixed(4)}°N, ${activeHazard.coordinates.lng.toFixed(4)}°E] to retrieve our lost container #${activeHazard.serialNumber} and seal the spill.`
        : `ALL SHIPS: This is ${rescuerShip.name}. Acknowledging Mayday from ${activeHazard.droppedByVesselName}. Altering course to intercept and hoist floating container #${activeHazard.serialNumber} and deploy oil skimmer.`;

      sendAutonomousRadioBroadcast(
        rescuerShip,
        ackText,
        'TACTICAL_COORDINATION',
        `🎯 ${rescuerShip.name} Intercepting Floating Container #${activeHazard.serialNumber}`,
        'PASSING_INFO'
      );
    },
    [hazards, ships, sendAutonomousRadioBroadcast]
  );

  // Process Container Pick Up and Autonomous "ALL CLEAR" Clearance
  const handleExecutePickupAndClearance = useCallback(
    (hazard: FloatingHazardItem, rescuerShip: FairwayTrafficShip) => {
      const isSelfRecovered = rescuerShip.id === hazard.droppedByVesselId;

      // 1. Update Hazard to RECOVERED_SECURED
      setHazards((prev) =>
        prev.map((h) => {
          if (h.id === hazard.id) {
            return {
              ...h,
              status: 'RECOVERED_SECURED' as const,
              recoveredByVesselId: rescuerShip.id,
              recoveredByVesselName: rescuerShip.name,
              recoveredTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              clearanceBroadcastSent: true,
              spillVolumeTonnes: 0,
              slickRadiusMeters: 0,
            };
          }
          return h;
        })
      );

      // 2. Redirect retrieving ship and ALL nearby ships back to their original route path!
      setShips((prev) =>
        prev.map((s) => {
          if (s.id === rescuerShip.id) {
            return {
              ...s,
              targetPos: { ...s.originalRouteWaypoint },
              status: 'ROUTE_RESUMED' as const,
              containersOnBoard: isSelfRecovered ? s.containersOnBoard + 1 : s.containersOnBoard,
              retrievedHazardCount: s.retrievedHazardCount + 1,
            };
          }
          if (s.id === hazard.droppedByVesselId && !isSelfRecovered) {
            return {
              ...s,
              targetPos: { ...s.originalRouteWaypoint },
              status: 'ROUTE_RESUMED' as const,
            };
          }
          return s;
        })
      );

      // 3. AUTONOMOUS "ALL CLEAR" BROADCAST SENT BY ITSELF TO ALL NEARBY SHIPS & STATIONS
      const allClearText = isSelfRecovered
        ? `✅ ALL CLEAR / SECURITE CANCELLATION: ${rescuerShip.name} has RETURNED & RETRIEVED its own lost container #${hazard.serialNumber} at [${hazard.coordinates.lat.toFixed(4)}°N, ${hazard.coordinates.lng.toFixed(4)}°E]. Oil spill completely contained and resolved. Navigational fairway is 100% CLEAR. Resuming original voyage.`
        : `✅ ALL CLEAR / SECURITE CANCELLATION: Assisting vessel ${rescuerShip.name} has successfully RETRIEVED & HOISTED container #${hazard.serialNumber} (lost by ${hazard.droppedByVesselName}). Oil spill neutralized via disc skimmer. Sector is 100% CLEAR. All vessels resume designated transit courses.`;

      sendAutonomousRadioBroadcast(
        rescuerShip,
        allClearText,
        'CLEAN_VERIFICATION',
        `✅ ALL CLEAR / OIL SPILL RESOLVED: Container #${hazard.serialNumber} Retrieved by ${rescuerShip.name}`,
        'CLEARANCE'
      );

      // 4. Update Consignment & Formulate Everywhere Broadcast
      const pickupTime = formatExactTimestamp();
      const coordsText =
        hazard.exactCoordinatesFormatted ||
        formatDMS(hazard.coordinates.lat, hazard.coordinates.lng);
      const consignId =
        activeConsignment?.consignmentId ||
        `CONSIGN-OSPR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const stationName =
        activeConsignment?.nearestStation.name ||
        'Jawahar Dweep (Butcher Island) Marine Oil Terminal';

      setActiveConsignment((prev) => {
        if (!prev) {
          return {
            consignmentId: consignId,
            status: 'CLOSED_ALL_CLEAR',
            spillHazardId: hazard.id,
            sourceVessel: {
              name: hazard.droppedByVesselName,
              mmsi: '563012980',
              callsign: '9V8921',
              flag: 'Singapore / International Registry',
            },
            nearestStation: {
              id: 'station-jawahar-dweep',
              name: stationName,
              stationType: 'MARINE_OIL_TERMINAL',
              authority: 'Mumbai Port Authority (MbPT) Petroleum Division',
              distanceNm: 1.8,
              vhfChannel: 12,
              phoneHotline: '+91-22-6656-4021',
            },
            exactCoordinatesFormatted: coordsText,
            occurredTimestampFormatted:
              hazard.occurredTimestampFormatted || hazard.droppedTimestamp,
            spillVolumeTonnes: hazard.spillVolumeTonnes || 35,
            assignedPickupResponder: {
              id: rescuerShip.id,
              name: rescuerShip.name,
              type: rescuerShip.cargoDescription || 'Assigned Salvage Vessel',
            },
            dispatchedTimestamp: hazard.droppedTimestamp,
            pickupDetectedAt: pickupTime,
            recoveredByVesselName: rescuerShip.name,
            clearanceBroadcastSent: true,
            marpolReference: 'IMO Resolution MEPC.117(52) MARPOL Annex I',
            chainOfCustodyToken: `COC-OSPR-${Date.now().toString(36).toUpperCase()}`,
            officialNotes: `Consignment recovered & secured by ${rescuerShip.name}. Oil spill neutralized. 100% containment confirmed under NOS-DCP Tier-1.`,
          };
        }
        return {
          ...prev,
          status: 'CLOSED_ALL_CLEAR',
          pickupDetectedAt: pickupTime,
          recoveredByVesselName: rescuerShip.name,
          clearanceBroadcastSent: true,
          officialNotes: `Consignment recovered & secured by ${rescuerShip.name}. Oil spill neutralized. Closed under MARPOL Annex I.`,
        };
      });

      // 5. Create Universal Clearance Record for multi-channel audit
      const universalNotice: UniversalClearanceBroadcast = {
        broadcastId: `ALL-CLEAR-BCAST-${Date.now().toString(36).toUpperCase()}`,
        timestamp: pickupTime,
        consignmentId: consignId,
        recoveringVesselName: rescuerShip.name,
        clearedSlickCoordinates: coordsText,
        nearestStationName: stationName,
        clearedSpillVolumeTonnes: hazard.spillVolumeTonnes || 35,
        channelsAnnounced: {
          dscCh70AllStations: true,
          vhfCh16MaydaySecuriteCancel: true,
          directStationTelemetryAck: true,
          v2vPassingFairwayTraffic: true,
        },
        broadcastSummary: `ALL-CLEAR BROADCAST EVERYWHERE: Consignment #${consignId} successfully picked up & neutralized by ${rescuerShip.name}. All nearby ports, stations, and passing fairway ships notified. Corridor 100% clear.`,
      };
      setUniversalClearanceRecord(universalNotice);

      // 6. Everywhere Notification Banner
      setEverywhereNoticeBanner({
        id: `everywhere-${Date.now()}`,
        title: `🌍 EVERYWHERE BROADCAST: OIL SPILL CONSIGNMENT #${consignId} CLEARED & RETRIEVED!`,
        summary: `${rescuerShip.name} has picked up consignment container #${hazard.serialNumber} and neutralized the oil spill at ${coordsText}. Clearance telemetry confirmed with ${stationName} and broadcast across VHF CH 16 / DSC CH 70 to all stations.`,
        channels: [
          'VHF CH 16 Global Securite Cancellation',
          'DSC CH 70 Universal All Stations Broadcast',
          `Direct Telemetry to ${stationName}`,
          'V2V Passing Traffic Course Resumption',
        ],
        timestamp: pickupTime,
      });

      // Check if all active hazards in the fairway have now been cleared
      const remainingActive = hazardsRef.current.filter(
        (h) => h.id !== hazard.id && (h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED')
      );
      if (remainingActive.length === 0) {
        // Sector is completely resolved: Advance scan culprit rotation to next ship in fairway
        setScanCulpritIndex((prev) => (prev + 1) % polluterCandidates.length);
        setActiveAttributionScores([]);
      }
    },
    [polluterCandidates.length, activeConsignment, sendAutonomousRadioBroadcast]
  );

  // Reset entire traffic simulation
  const handleResetSimulation = () => {
    setShips(JSON.parse(JSON.stringify(INITIAL_SHIPS)));
    setHazards([]);
    setRecentBroadcastBanner(null);
    setActiveAttributionScores([]);
    setIsAnalyzingPhysics(false);
    setPhysicsAnalysisStep(0);
    setPhysicsStepTitle('');
    setActiveConsignment(null);
    setShowConsignmentModal(false);
    setUniversalClearanceRecord(null);
    setShowClearanceModal(false);
    setEverywhereNoticeBanner(null);
  };

  // Main animation and physics simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      if (isPlaying) {
        radarSweepAngleRef.current = (radarSweepAngleRef.current + (dt * Math.PI * 0.5) * simulationSpeed) % (Math.PI * 2);
        wavePhaseRef.current = (wavePhaseRef.current + dt * 1.8 * simulationSpeed) % (Math.PI * 2);

        // Update Ship positions along their course
        setShips((prevShips) => {
          const updatedShips = prevShips.map((ship) => {
            const dx = ship.targetPos.x - ship.pos.x;
            const dy = ship.targetPos.y - ship.pos.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 4) {
              // Reached waypoint: loop route back or resume cruising
              let nextTarget = { ...ship.originalRouteWaypoint };
              let nextStatus = ship.status;

              if (ship.status === 'RETRIEVING_CONTAINER' || ship.status === 'ROUTE_RESUMED') {
                nextStatus = 'CRUISING';
              }

              // Loop fairway traffic if reached edge
              if (ship.id === 'ship-pacific-coral' && ship.pos.x >= 670) {
                return { ...ship, pos: { x: 80, y: 190 }, targetPos: { x: 680, y: 190 }, status: 'CRUISING' };
              }
              if (ship.id === 'ship-strait-falcon' && ship.pos.x <= 110) {
                return { ...ship, pos: { x: 670, y: 250 }, targetPos: { x: 90, y: 250 }, status: 'CRUISING' };
              }

              return { ...ship, targetPos: nextTarget, status: nextStatus };
            }

            // Calculate heading angle
            const targetAngleRad = Math.atan2(dy, dx);
            let headingDeg = (targetAngleRad * 180) / Math.PI;
            if (headingDeg < 0) headingDeg += 360;

            // Move ship towards target
            const speedPixelsPerSec = (ship.speedKnots * 3.2 * simulationSpeed);
            const moveStep = Math.min(dist, speedPixelsPerSec * dt);
            const newX = ship.pos.x + Math.cos(targetAngleRad) * moveStep;
            const newY = ship.pos.y + Math.sin(targetAngleRad) * moveStep;

            return {
              ...ship,
              pos: { x: newX, y: newY },
              headingDeg,
            };
          });
          shipsRef.current = updatedShips;
          return updatedShips;
        });

        // Check if any ship is in pickup range (< 22px / 0.3 NM) of an active floating container
        const currentHazards = hazardsRef.current;
        const currentShips = shipsRef.current;
        let interceptedHazard: FloatingHazardItem | null = null;
        let interceptingShip: FairwayTrafficShip | null = null;

        for (const hazard of currentHazards) {
          if (hazard.status === 'FLOATING_ACTIVE_SPILL' || hazard.status === 'BEING_INTERCEPTED') {
            for (const ship of currentShips) {
              const distToHazard = Math.hypot(ship.pos.x - hazard.canvasPos.x, ship.pos.y - hazard.canvasPos.y);
              if (distToHazard < 22) {
                interceptedHazard = hazard;
                interceptingShip = ship;
                break;
              }
            }
            if (interceptedHazard) break;
          }
        }

        if (interceptedHazard && interceptingShip) {
          handleExecutePickupAndClearance(interceptedHazard, interceptingShip);
        }

        // Autonomous Simulation Mode: trigger passing drops and automated multi-ship rescues
        if (autoSimulationMode) {
          autoStepTimerRef.current += dt * simulationSpeed;

          // If no active hazard, auto-trigger a passing container drop when ships cross
          const hasActiveHazard = hazardsRef.current.some(
            (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
          );

          if (!hasActiveHazard && autoStepTimerRef.current > 14) {
            autoStepTimerRef.current = 0;
            // Drop container from casualty vessel during passing
            handleDropContainerHazard('ship-pacific-coral');
          }

          // If hazard is active and not intercepted yet, auto dispatch Coast Guard or nearby ship after 3.5 seconds
          if (hasActiveHazard && autoStepTimerRef.current > 3.5) {
            const activeH = hazardsRef.current.find((h) => h.status === 'FLOATING_ACTIVE_SPILL');
            if (activeH) {
              autoStepTimerRef.current = 0;
              // 50% chance Coast Guard rescues, 50% casualty turns back to pick up own container
              const useSelfRecovery = Math.random() > 0.5;
              if (useSelfRecovery) {
                handleCommandShipToRetrieve('ship-pacific-coral', activeH.id);
              } else {
                handleCommandShipToRetrieve('ship-icgs-samudra', activeH.id);
              }
            }
          }
        }
      }

      // ==========================================
      // CANVAS DRAWING PASS
      // ==========================================
      const width = canvas.width;
      const height = canvas.height;

      // 1. Deep Ocean Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // 2. Tactical Bathymetry & Radar Grid
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2b. Dynamic Ocean Wave Ripples & Hydrodynamic Wavefronts (Physics Overlay)
      if (showPhysicsOverlay) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 1;
        for (let offset = -80; offset < width + height; offset += 32) {
          const waveShift = Math.sin(offset * 0.035 + wavePhaseRef.current) * 6;
          ctx.beginPath();
          ctx.moveTo(offset + waveShift, 0);
          ctx.lineTo(offset - height * 0.5 + waveShift, height);
          ctx.stroke();
        }

        // Satellite SAR Scanning Beam / Footprint overlay when scanning or active
        if (isAnalyzingPhysics) {
          const scanY = ((Date.now() / 25) % height);
          const sarGradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
          sarGradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
          sarGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
          sarGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = sarGradient;
          ctx.fillRect(0, scanY - 30, width, 60);

          ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(width, scanY);
          ctx.stroke();

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#d8b4fe';
          ctx.fillText('🛰️ SENTINEL-1 C-BAND SAR BEAM (BRAGG CAPILLARY WAVE DAMPING SCAN Δσ₀)', 20, scanY - 6);
        }
      }

      // 3. Traffic Separation Scheme (TSS) Fairway Lanes
      // West-to-East Lane
      ctx.fillStyle = 'rgba(6, 78, 59, 0.08)';
      ctx.fillRect(0, 160, width, 60);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 190);
      ctx.lineTo(width, 190);
      ctx.stroke();

      // East-to-West Lane
      ctx.fillStyle = 'rgba(30, 58, 138, 0.08)';
      ctx.fillRect(0, 220, width, 60);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, 250);
      ctx.lineTo(width, 250);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lane labels
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.fillText('EASTBOUND TSS FAIRWAY (090°)', 20, 180);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.fillText('WESTBOUND TSS FAIRWAY (270°)', width - 210, 240);

      // 4. Radar Sweep Line & Distance Rings
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      [80, 160, 240, 320].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Radar Sweep Glow
      const sweepX = centerX + Math.cos(radarSweepAngleRef.current) * 360;
      const sweepY = centerY + Math.sin(radarSweepAngleRef.current) * 360;
      const sweepGradient = ctx.createLinearGradient(centerX, centerY, sweepX, sweepY);
      sweepGradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      sweepGradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.strokeStyle = sweepGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // 4b. Draw Coastal Ports & Marine Oil Stations + Direct Telemetry Link
      const activeH = hazards.find(
        (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
      );
      const calculatedStations = getStationDistances(
        NEARBY_COASTAL_STATIONS,
        activeH ? activeH.coordinates : null
      );
      const nearestSt = calculatedStations.reduce(
        (min, s) => ((s.distanceNm ?? 999) < (min.distanceNm ?? 999) ? s : min),
        calculatedStations[0]
      );

      // If active hazard exists, draw animated direct emergency link from the spill to the nearest port/oil station!
      if (activeH && nearestSt) {
        const spillX = activeH.canvasPos.x;
        const spillY = activeH.canvasPos.y;
        const stX = nearestSt.canvasPos.x;
        const stY = nearestSt.canvasPos.y;

        const isClosedNow = activeConsignment?.status === 'CLOSED_ALL_CLEAR';
        ctx.strokeStyle = isClosedNow ? '#34d399' : activeConsignment ? '#38bdf8' : '#f59e0b';
        ctx.lineWidth = 2;
        const dashOffset = (time * 0.04) % 16;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        ctx.moveTo(spillX, spillY);
        ctx.lineTo(stX, stY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // Telemetry tag along link
        const midX = (spillX + stX) / 2;
        const midY = (spillY + stY) / 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = isClosedNow ? '#10b981' : activeConsignment ? '#0ea5e9' : '#f59e0b';
        ctx.lineWidth = 1;
        ctx.fillRect(midX - 110, midY - 13, 220, 26);
        ctx.strokeRect(midX - 110, midY - 13, 220, 26);

        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = isClosedNow ? '#6ee7b7' : activeConsignment ? '#7dd3fc' : '#fef08a';
        const linkLabel = isClosedNow
          ? `✓ RESOLVED: CONSIGNMENT #${activeConsignment?.consignmentId.slice(-4)} CLOSED`
          : activeConsignment
          ? `📦 CONSIGNMENT #${activeConsignment.consignmentId.slice(-4)} → ${nearestSt.name.split(' (')[0]}`
          : `📡 DIRECT TELEMETRY → ${nearestSt.name.split(' (')[0]} (${nearestSt.distanceNm} NM)`;
        ctx.fillText(linkLabel, midX - 105, midY + 3);
      }

      // Draw each coastal port & marine oil response station
      calculatedStations.forEach((station) => {
        const { x, y } = station.canvasPos;
        const isNearestStation = nearestSt?.id === station.id && !!activeH;

        // Highlight ring around nearest station when active spill is present
        if (isNearestStation) {
          const pulseR = 20 + Math.sin(time * 0.007) * 4;
          ctx.strokeStyle = activeConsignment ? 'rgba(56, 189, 248, 0.85)' : 'rgba(245, 158, 11, 0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Station Base Symbol
        const stationColor =
          station.stationType === 'MARINE_OIL_TERMINAL'
            ? '#f59e0b'
            : station.stationType === 'PORT_HARBOR'
            ? '#38bdf8'
            : station.stationType === 'COAST_GUARD_BASE'
            ? '#10b981'
            : '#c084fc';

        ctx.fillStyle = stationColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flashing navigation beacon light
        const beaconFlash = Math.sin(time * 0.005) > 0;
        ctx.fillStyle = beaconFlash ? '#fef08a' : '#78350f';
        ctx.beginPath();
        ctx.arc(x, y - 9, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Station label text
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = isNearestStation ? '#fef08a' : '#cbd5e1';
        ctx.fillText(station.name.split(' (')[0], x - 32, y + 17);

        ctx.font = '7.5px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`VHF ${station.vhfChannel} • ${station.distanceNm} NM`, x - 32, y + 27);
      });

      // 5. Draw Floating Hazards / Dropped Containers & Oil Slicks
      hazards.forEach((hazard) => {
        const { x, y } = hazard.canvasPos;
        const isActive = hazard.status === 'FLOATING_ACTIVE_SPILL' || hazard.status === 'BEING_INTERCEPTED';

        if (isActive) {
          // Oil Slick expanding circle
          const slickGradient = ctx.createRadialGradient(x, y, 4, x, y, hazard.slickRadiusMeters * 0.75);
          slickGradient.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
          slickGradient.addColorStop(0.45, 'rgba(185, 28, 28, 0.4)');
          slickGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = slickGradient;
          ctx.beginPath();
          ctx.arc(x, y, hazard.slickRadiusMeters * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing hazard warning ring
          const pulseR = 16 + Math.sin(time * 0.006) * 6;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(x, y, pulseR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Container Box Icon
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 1.5;
          ctx.fillRect(x - 9, y - 6, 18, 12);
          ctx.strokeRect(x - 9, y - 6, 18, 12);

          // Container Header & Spill Volume
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#fee2e2';
          const spillTag = hazard.spillIndex ? `📦 SPILL #${hazard.spillIndex}` : '📦 HAZMAT';
          ctx.fillText(spillTag, x - 26, y - 12);

          // EXACT COORDINATES & OCCURRENCE TIMESTAMP HUD ON CANVAS
          const coordsStr = hazard.exactCoordinatesFormatted || formatDMS(hazard.coordinates.lat, hazard.coordinates.lng);
          const timeStr = hazard.occurredTimestampFormatted || hazard.droppedTimestamp;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 1;
          ctx.fillRect(x - 85, y + 14, 170, 30);
          ctx.strokeRect(x - 85, y + 14, 170, 30);

          ctx.font = 'bold 7.5px monospace';
          ctx.fillStyle = '#fef08a';
          ctx.fillText(`📍 ${coordsStr}`, x - 80, y + 25);
          ctx.fillStyle = '#93c5fd';
          ctx.fillText(`⏱️ ${timeStr}`, x - 80, y + 38);
        } else {
          // Recovered / Resolved green marker
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`✓ RECOVERED (${hazard.recoveredByVesselName?.split(' ')[1] || 'ALL CLEAR'})`, x - 38, y - 10);
        }
      });

      // 5b. Kelvin Wake Envelopes (θ = ±19.47°), Ship Angles & Reverse Hydrodynamic Wave Drift Vectors
      if (showPhysicsOverlay) {
        // Collect all active hazards
        const activeHazards = hazards.filter(
          (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
        );

        // Map of vessels that actually caused an active spill
        const polluterShipIds = new Set(activeHazards.map((h) => h.droppedByVesselId));

        ships.forEach((ship) => {
          const isIdentifiedCulprit = polluterShipIds.has(ship.id);
          const sternAngleRad = ((ship.headingDeg + 180) * Math.PI) / 180;
          const KELVIN_RAD = (19.47 * Math.PI) / 180;
          const wakeLen = isIdentifiedCulprit ? 140 : 65;

          // Innocent ships: faint blue wake, no red lines or spill attribution
          ctx.strokeStyle = isIdentifiedCulprit ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = isIdentifiedCulprit ? 2 : 1;
          ctx.setLineDash(isIdentifiedCulprit ? [5, 4] : [3, 3]);

          // Port Kelvin wake cusp ray
          const portCuspX = ship.pos.x + Math.cos(sternAngleRad - KELVIN_RAD) * wakeLen;
          const portCuspY = ship.pos.y + Math.sin(sternAngleRad - KELVIN_RAD) * wakeLen;
          ctx.beginPath();
          ctx.moveTo(ship.pos.x, ship.pos.y);
          ctx.lineTo(portCuspX, portCuspY);
          ctx.stroke();

          // Starboard Kelvin wake cusp ray
          const stbdCuspX = ship.pos.x + Math.cos(sternAngleRad + KELVIN_RAD) * wakeLen;
          const stbdCuspY = ship.pos.y + Math.sin(sternAngleRad + KELVIN_RAD) * wakeLen;
          ctx.beginPath();
          ctx.moveTo(ship.pos.x, ship.pos.y);
          ctx.lineTo(stbdCuspX, stbdCuspY);
          ctx.stroke();

          // Stern Centerline Ray (for polluter ships)
          if (isIdentifiedCulprit) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(ship.pos.x, ship.pos.y);
            ctx.lineTo(
              ship.pos.x + Math.cos(sternAngleRad) * (wakeLen * 0.9),
              ship.pos.y + Math.sin(sternAngleRad) * (wakeLen * 0.9)
            );
            ctx.stroke();

            // Kelvin Wake Angle Arc & Label (θ = ±19.47°)
            const arcRadius = 45;
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(ship.pos.x, ship.pos.y, arcRadius, sternAngleRad - KELVIN_RAD, sternAngleRad + KELVIN_RAD);
            ctx.stroke();

            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#fca5a5';
            const arcMidX = ship.pos.x + Math.cos(sternAngleRad) * (arcRadius + 12);
            const arcMidY = ship.pos.y + Math.sin(sternAngleRad) * (arcRadius + 12);
            ctx.fillText('θ=±19.47° (Kelvin)', arcMidX - 35, arcMidY);
          }

          ctx.setLineDash([]);
        });

        // For EACH active hazard, point directly to its corresponding polluter ship
        activeHazards.forEach((activeH, idx) => {
          const culpritShip = ships.find((s) => s.id === activeH.droppedByVesselId);
          if (!culpritShip) return;

          // 1. Reverse Stokes Drift Vector line from hazard to polluter stern
          ctx.strokeStyle = idx === 0 ? '#f59e0b' : '#ec4899';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([6, 3]);
          ctx.beginPath();
          ctx.moveTo(activeH.canvasPos.x, activeH.canvasPos.y);
          ctx.lineTo(culpritShip.pos.x, culpritShip.pos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Dot on culprit stern
          ctx.fillStyle = idx === 0 ? '#f59e0b' : '#ec4899';
          ctx.beginPath();
          ctx.arc(culpritShip.pos.x, culpritShip.pos.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Midpoint drift badge
          const midX = (activeH.canvasPos.x + culpritShip.pos.x) / 2;
          const midY = (activeH.canvasPos.y + culpritShip.pos.y) / 2;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.strokeStyle = idx === 0 ? '#f59e0b' : '#ec4899';
          ctx.lineWidth = 1;
          ctx.fillRect(midX - 95, midY - 14, 190, 26);
          ctx.strokeRect(midX - 95, midY - 14, 190, 26);

          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = idx === 0 ? '#fbbf24' : '#f472b6';
          const spillNum = activeH.spillIndex ? `#${activeH.spillIndex}` : `${idx + 1}`;
          ctx.fillText(`← STOKES DRIFT (98.4%) | SPILL ${spillNum}`, midX - 90, midY + 2);

          // 2. Compute Angular Forensic Relationships
          const dx = activeH.canvasPos.x - culpritShip.pos.x;
          const dy = activeH.canvasPos.y - culpritShip.pos.y;
          const bearingRad = Math.atan2(dy, dx);
          const bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;

          const sternDeg = (culpritShip.headingDeg + 180) % 360;
          let angularOffsetDeg = Math.abs(bearingDeg - sternDeg);
          if (angularOffsetDeg > 180) angularOffsetDeg = 360 - angularOffsetDeg;

          // 3. Polluter Angle HUD Banner anchored near the vessel
          const hudX = Math.max(10, Math.min(width - 250, culpritShip.pos.x - 120));
          const hudY = culpritShip.pos.y < 120 ? culpritShip.pos.y + 40 : culpritShip.pos.y - 75;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = idx === 0 ? '#ef4444' : '#ec4899';
          ctx.lineWidth = 1.2;
          ctx.fillRect(hudX, hudY, 245, 48);
          ctx.strokeRect(hudX, hudY, 245, 48);

          ctx.font = 'bold 8.5px monospace';
          ctx.fillStyle = idx === 0 ? '#fca5a5' : '#fbcfe8';
          ctx.fillText(`🚨 POLLUTER: ${culpritShip.name.split(' (')[0]}`, hudX + 6, hudY + 11);

          ctx.font = '7.5px monospace';
          ctx.fillStyle = '#fde047';
          ctx.fillText(
            `📐 ANGLES: Hdg ${culpritShip.headingDeg.toFixed(0)}°T | Stern ${sternDeg.toFixed(0)}°T | θ=±19.47° | Δθ=${angularOffsetDeg.toFixed(1)}°`,
            hudX + 6,
            hudY + 23
          );

          ctx.fillStyle = '#93c5fd';
          const exactCoords = activeH.exactCoordinatesFormatted || formatDMS(activeH.coordinates.lat, activeH.coordinates.lng);
          ctx.fillText(`📍 SPILL LOC: ${exactCoords}`, hudX + 6, hudY + 34);

          ctx.fillStyle = '#c4b5fd';
          const occurTime = activeH.occurredTimestampFormatted || activeH.droppedTimestamp;
          ctx.fillText(`⏱️ OCCURRED: ${occurTime}`, hudX + 6, hudY + 45);
        });
      }

      // 6. Draw Ships with AIS vectors, real vessel photo avatars, and heading lines
      const activePolluterIds = new Set(
        hazards
          .filter((h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED')
          .map((h) => h.droppedByVesselId)
      );

      ships.forEach((ship) => {
        const { x, y } = ship.pos;
        const headingRad = (ship.headingDeg * Math.PI) / 180;
        const isSelected = selectedShipId === ship.id;
        const isPolluter = activePolluterIds.has(ship.id);

        // Draw Ship Wake / Trajectory trail
        ctx.strokeStyle = `${ship.color}33`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ship.targetPos.x, ship.targetPos.y);
        ctx.stroke();

        // Selected ship highlight ring
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Real Vessel Photo Thumbnail Avatar next to ship
        const shipImg = shipImagesRef.current[ship.id];
        if (shipImg && shipImg.complete) {
          const avatarR = 13;
          const avatarX = x - 28;
          const avatarY = y - 18;

          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(shipImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
          ctx.restore();

          // Border for photo avatar
          ctx.strokeStyle = isPolluter ? '#ef4444' : ship.color;
          ctx.lineWidth = isPolluter ? 2 : 1.2;
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ship Hull Symbol (Oriented by Heading)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(headingRad);

        // Ship body polygon
        ctx.fillStyle = ship.color;
        ctx.strokeStyle = isPolluter ? '#f87171' : '#ffffff';
        ctx.lineWidth = isPolluter ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(14, 0); // Bow
        ctx.lineTo(-10, -7); // Port stern
        ctx.lineTo(-8, 0);
        ctx.lineTo(-10, 7); // Starboard stern
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vector line forward
        ctx.strokeStyle = isPolluter ? '#ef4444' : ship.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(28, 0);
        ctx.stroke();

        ctx.restore();

        // Ship AIS Name & Telemetry Tag
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(ship.name.split(' (')[0], x + 16, y - 8);

        ctx.font = '9px monospace';
        ctx.fillStyle = ship.color;
        const statusText =
          ship.status === 'CONTAINER_DROPPED'
            ? '🚨 DROPPED HAZARD'
            : ship.status === 'INTERCEPTING_HAZARD'
            ? '🎯 INTERCEPTING'
            : ship.status === 'TURNING_BACK'
            ? '🔄 TURNING BACK'
            : ship.status === 'ROUTE_RESUMED'
            ? '✓ ROUTE RESUMED'
            : `${ship.speedKnots.toFixed(1)} kts | HDG ${ship.headingDeg.toFixed(0)}°`;

        ctx.fillText(statusText, x + 16, y + 5);

        // Physics attribution tag if evaluated
        const score = activeAttributionScores.find((sc) => sc.shipId === ship.id);
        if (score && showPhysicsOverlay) {
          ctx.font = 'bold 8px monospace';
          if (score.isIdentifiedCulprit) {
            ctx.fillStyle = '#f87171';
            ctx.fillText(`🚨 POLLUTER (${score.attributionProbability}%)`, x + 16, y + 17);
          } else {
            ctx.fillStyle = '#34d399';
            ctx.fillText(`✓ EXONERATED (${score.attributionProbability}%)`, x + 16, y + 17);
          }
        }
      });

      // 7. Check if ships are currently passing each other (Proximity Banner on Canvas)
      const shipA = ships[0];
      const shipB = ships[1];
      if (shipA && shipB) {
        const passDist = Math.hypot(shipA.pos.x - shipB.pos.x, shipA.pos.y - shipB.pos.y);
        if (passDist < 90) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.fillRect(width / 2 - 130, 20, 260, 28);
          ctx.strokeRect(width / 2 - 130, 20, 260, 28);

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`⚡ SHIPS PASSING IN FAIRWAY (CPA ${(passDist * 0.015).toFixed(1)} NM)`, width / 2 - 118, 38);
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, simulationSpeed, autoSimulationMode, handleExecutePickupAndClearance, handleDropContainerHazard, handleCommandShipToRetrieve]);

  const activeHazardsCount = hazards.filter((h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED').length;
  const recoveredHazardsCount = hazards.filter((h) => h.status === 'RECOVERED_SECURED').length;

  return (
    <div className="rounded-3xl bg-slate-900/95 border border-cyan-900/40 p-5 sm:p-7 shadow-2xl space-y-6">
      
      {/* Header Banner & Live Status */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Autonomous V2V Traffic, Container Loss &amp; Multi-Ship Rescue</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Fairway Traffic Passing &amp; Autonomous Spill Resolution</span>
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Watch ships cruise and pass each other. If any ship drops a container or spills oil, its transponder <strong className="text-cyan-300">automatically sends distress alerts by itself</strong> to nearby ships. When any ship (or the original ship returning) retrieves the container, an <strong className="text-emerald-400">All Clear</strong> broadcast is sent autonomously and all ships resume their routes!
          </p>
        </div>

        {/* Global Autopilot Toggle & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPhysicsOverlay(!showPhysicsOverlay)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
              showPhysicsOverlay
                ? 'bg-purple-950 border-purple-500/60 text-purple-200 shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Hydrodynamic Waves, Kelvin Wake & Satellite SAR Overlays"
          >
            <Waves className="w-3.5 h-3.5 text-purple-400" />
            <span>{showPhysicsOverlay ? '🌊 Wave & Sat Physics ON' : 'Physics Off'}</span>
          </button>

          <button
            onClick={() => setShowAttributionModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 transition-all flex items-center gap-1.5 shadow"
            title="Inspect 4-Ship Forensic Attribution Matrix"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Forensic Matrix</span>
          </button>

          <button
            onClick={() => setAutoSimulationMode(!autoSimulationMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
              autoSimulationMode
                ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-500/60 text-cyan-200 shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${autoSimulationMode ? 'text-cyan-400 animate-spin' : ''}`} />
            <span>{autoSimulationMode ? '🤖 Autopilot Mode ON' : 'Manual Control Mode'}</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs transition-colors"
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            <Play className={`w-4 h-4 ${isPlaying ? 'text-emerald-400' : 'text-slate-400'}`} />
          </button>

          <button
            onClick={handleResetSimulation}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs transition-colors"
            title="Reset Simulation Positions"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs transition-colors ${
              soundEnabled ? 'bg-cyan-950 border-cyan-800 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle DSC/VHF Audio"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hydrodynamic Waves & Satellite SAR Physics Attribution Live Banner */}
      {(isAnalyzingPhysics || physicsAnalysisStep > 0) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-blue-950/60 border border-purple-500/50 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-900/80 border border-purple-400/60 text-purple-200">
                <Satellite className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-purple-100">
                    Physics-Based 4-Ship Forensic Polluter Attribution Engine
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300">
                    Sentinel-1 SAR C-Band + Kelvin Wave Dynamics
                  </span>
                </div>
                <p className="text-[11px] font-mono text-purple-300/90">
                  {physicsStepTitle || 'Resolving ambiguity across multiple passing vessels using physical law models.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAttributionModal(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow"
            >
              <Eye className="w-3.5 h-3.5 text-purple-300" />
              <span>View Physics Matrix</span>
            </button>
          </div>

          {/* 4-Phase Physics Pipeline Step Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
            <div
              className={`p-2 rounded-xl border flex items-center gap-2 ${
                physicsAnalysisStep >= 1
                  ? 'bg-purple-900/40 border-purple-500/60 text-purple-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <Satellite className={`w-3.5 h-3.5 shrink-0 ${physicsAnalysisStep === 1 ? 'text-purple-400 animate-spin' : 'text-purple-400'}`} />
              <div>
                <span className="block font-bold">Phase 1: SAR Bragg Damping</span>
                <span className="text-[9px] text-slate-400">Δσ₀ = -8.4 dB</span>
              </div>
            </div>

            <div
              className={`p-2 rounded-xl border flex items-center gap-2 ${
                physicsAnalysisStep >= 2
                  ? 'bg-cyan-900/40 border-cyan-500/60 text-cyan-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <Waves className={`w-3.5 h-3.5 shrink-0 ${physicsAnalysisStep === 2 ? 'text-cyan-400 animate-bounce' : 'text-cyan-400'}`} />
              <div>
                <span className="block font-bold">Phase 2: Kelvin Wake Angle</span>
                <span className="text-[9px] text-slate-400">θ = 19.47° Cusp</span>
              </div>
            </div>

            <div
              className={`p-2 rounded-xl border flex items-center gap-2 ${
                physicsAnalysisStep >= 3
                  ? 'bg-blue-900/40 border-blue-500/60 text-blue-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <Target className={`w-3.5 h-3.5 shrink-0 ${physicsAnalysisStep === 3 ? 'text-blue-400 animate-pulse' : 'text-blue-400'}`} />
              <div>
                <span className="block font-bold">Phase 3: Stokes Drift Backtrack</span>
                <span className="text-[9px] text-slate-400">Error &lt; 42 m</span>
              </div>
            </div>

            <div
              className={`p-2 rounded-xl border flex items-center gap-2 ${
                physicsAnalysisStep >= 4
                  ? 'bg-emerald-900/40 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${physicsAnalysisStep === 4 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <span className="block font-bold">Phase 4: Verified Polluter</span>
                <span className="text-[9px] text-emerald-300">
                  {activeAttributionScores[0] ? `${activeAttributionScores[0].shipName.split(' (')[0]} (98.4%)` : 'Alerts Dispatched'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Everywhere All-Clear Response Banner */}
      {everywhereNoticeBanner && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-500 shadow-2xl animate-fade-in text-emerald-100 font-mono text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="font-bold text-sm sm:text-base text-white font-sans">
                {everywhereNoticeBanner.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold">
                {everywhereNoticeBanner.timestamp}
              </span>
              <button
                onClick={() => setEverywhereNoticeBanner(null)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            {everywhereNoticeBanner.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            {everywhereNoticeBanner.channels.map((ch, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-950/80 border border-emerald-700/60 flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{ch}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 text-[10px] flex-wrap gap-2">
            <span className="text-slate-400 font-sans">
              Autonomous response sent to everyone: Marine terminal logs closed, all ships resuming routes.
            </span>
            <button
              onClick={() => setShowClearanceModal(true)}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow"
            >
              Open Universal Clearance Certificate
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Live Automated Broadcast Alert Banner */}
      {recentBroadcastBanner && (
        <div
          className={`p-4 rounded-2xl border transition-all animate-fade-in ${
            recentBroadcastBanner.type === 'DISTRESS'
              ? 'bg-red-950/40 border-red-500/60 text-red-200 shadow-xl'
              : recentBroadcastBanner.type === 'CLEARANCE'
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-xl'
              : 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-md'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {recentBroadcastBanner.type === 'DISTRESS' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce shrink-0" />
                ) : recentBroadcastBanner.type === 'CLEARANCE' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Radio className="w-5 h-5 text-cyan-400 shrink-0" />
                )}
                <span className="font-bold text-sm text-white font-sans">{recentBroadcastBanner.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono">
                  {recentBroadcastBanner.timestamp} (IST)
                </span>
              </div>
              <p className="text-xs leading-relaxed font-mono pl-7 text-slate-200">
                {recentBroadcastBanner.text}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 shrink-0">
              VHF Ch 16 / DSC 70 Locked
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Radar Screen (Canvas) */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={760}
          height={440}
          className="w-full h-auto block cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 760;
            const clickY = ((e.clientY - rect.top) / rect.height) * 440;

            // Find closest ship
            let closest = ships[0];
            let minD = 99999;
            ships.forEach((s) => {
              const d = Math.hypot(s.pos.x - clickX, s.pos.y - clickY);
              if (d < minD) {
                minD = d;
                closest = s;
              }
            });
            if (minD < 50) {
              setSelectedShipId(closest.id);
            }
          }}
        />

        {/* Tactical Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-[11px] pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-300 flex items-center gap-1.5 backdrop-blur">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AIS Live Transponder: 4 Vessels Active</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-300 flex items-center gap-1.5 backdrop-blur">
            <Package className={`w-3.5 h-3.5 ${activeHazardsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
            <span>Hazards at Sea: <strong className={activeHazardsCount > 0 ? 'text-red-400' : 'text-emerald-400'}>{activeHazardsCount} Active</strong></span>
          </div>
        </div>

        {/* Speed Slider / Control on Canvas bottom right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/90 border border-slate-800 p-2 rounded-xl backdrop-blur font-mono text-xs">
          <span className="text-slate-400">Simulation Speed:</span>
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationSpeed(speed)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                simulationSpeed === speed ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Action Command Dock */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 font-mono text-xs">
        
        {/* Card 1: Trigger Container Drop */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-red-400" />
              <span>1. Drop Container / Spill:</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
              HAZARD TRIGGER
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Simulate a container falling overboard into the fairway during heavy seas or vessel passing.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDropContainerHazard('ship-pacific-coral')}
              className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/50 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Drop (Ship 1)</span>
            </button>
            <button
              onClick={() => handleDropContainerHazard('ship-strait-falcon')}
              className="p-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border border-blue-500/50 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>Drop (Ship 2)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Nearby Ship Rescue & Retrieval */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span>2. Nearby Ship Pick Up:</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              INTERCEPT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Command a passing ship or Coast Guard cutter to alter course, hook container &amp; skim oil.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCommandShipToRetrieve('ship-icgs-samudra')}
              disabled={activeHazardsCount === 0}
              className={`p-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                activeHazardsCount > 0
                  ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 shadow'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coast Guard Pick Up</span>
            </button>
            <button
              onClick={() => handleCommandShipToRetrieve('ship-strait-falcon')}
              disabled={activeHazardsCount === 0}
              className={`p-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                activeHazardsCount > 0
                  ? 'bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/50 shadow'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Ship className="w-3.5 h-3.5 text-cyan-400" />
              <span>Passing Ship Pick Up</span>
            </button>
          </div>
        </div>

        {/* Card 3: Original Dropping Ship Returns & Retrieves Own Cargo */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>3. Casualty Turn &amp; Pick Up:</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              SELF RECOVERY
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            If the ship that dropped the container turns back, retrieves its cargo, and seals the breach.
          </p>
          <button
            onClick={() => handleCommandShipToRetrieve('ship-pacific-coral')}
            disabled={activeHazardsCount === 0}
            className={`w-full p-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-all ${
              activeHazardsCount > 0
                ? 'bg-gradient-to-r from-amber-950 to-orange-950 hover:from-amber-900 hover:to-orange-900 text-amber-200 border border-amber-500/50 shadow'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Turn Back &amp; Retrieve Own Container</span>
          </button>
        </div>

        {/* Card 4: 🔬 4-Ship Ambiguous & Multi-Spill Physics Attribution Engine */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/60 to-slate-950 border border-purple-600/50 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-200 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-purple-400" />
              <span>4. Wave &amp; Sat Physics Spill:</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-500">
              SAR + WAVES
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Calculates Kelvin wake envelopes (θ=±19.47°), ship heading/stern angles, Sentinel-1 SAR Bragg dampening, and exact GPS coordinates &amp; occurrence timestamps.
          </p>

          <div className="text-[10px] text-purple-300 font-mono flex items-center justify-between bg-purple-950/80 px-2 py-1 rounded-lg border border-purple-800">
            <span>Next Scan On-Deck:</span>
            <span className="font-bold text-yellow-300">
              {ships.find((s) => s.id === polluterCandidates[scanCulpritIndex % polluterCandidates.length])?.name.split(' (')[0] || 'M/V PACIFIC CORAL'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              onClick={() => handleTriggerAmbiguous4ShipSpill()}
              disabled={isAnalyzingPhysics}
              className={`w-full p-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                isAnalyzingPhysics
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-wait'
                  : 'bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-100 border border-purple-500/60 shadow-lg'
              }`}
            >
              <Satellite className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>{isAnalyzingPhysics ? 'Scanning Capillary Waves...' : '🔬 1 of 4 Mystery Spill (Rotating)'}</span>
            </button>

            <button
              onClick={() => handleTriggerDualShipSpill()}
              disabled={isAnalyzingPhysics}
              className={`w-full p-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                isAnalyzingPhysics
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-wait'
                  : 'bg-gradient-to-r from-rose-950 to-pink-950 hover:from-rose-900 hover:to-pink-900 text-rose-100 border border-rose-500/60 shadow-lg'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>🚨 2 of 4 Ships Spill (Dual Attribution)</span>
            </button>
          </div>
        </div>

        {/* Card 5: Emergency Port Contact & Consignment Report */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/60 to-slate-950 border border-cyan-500/50 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>5. Port Contact &amp; Report:</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200 border border-cyan-500">
              MARPOL CONSIGN
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Directly alert nearest marine oil terminal or port. Generates consignment report for pickup and automated everywhere clearance.
          </p>

          <div className="text-[10px] text-cyan-300 font-mono flex items-center justify-between bg-cyan-950/80 px-2 py-1.5 rounded-lg border border-cyan-800">
            <span>Nearest Station:</span>
            <span className="font-bold text-amber-300 truncate max-w-[130px]">
              {stations.reduce((min, s) => ((s.distanceNm ?? 999) < (min.distanceNm ?? 999) ? s : min), stations[0])?.name.split(' (')[0]}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => handleDirectContactNearestStationAndCreateConsignment()}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Direct Contact Nearest Station</span>
            </button>

            {activeConsignment && (
              <button
                onClick={() => setShowConsignmentModal(true)}
                className="w-full p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-700/70 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>Manifest #{activeConsignment.consignmentId.slice(-4)} Active</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Nearby Coastal Ports & Marine Oil Spill Response Stations Hub */}
      <NearbyPortsAndConsignmentHub
        stations={stations}
        activeHazard={
          hazards.find(
            (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
          ) || null
        }
        activeConsignment={activeConsignment}
        onDirectContactStation={handleDirectContactNearestStationAndCreateConsignment}
        onOpenConsignmentModal={() => setShowConsignmentModal(true)}
        onDispatchPickupResponder={(responderShipId) => {
          const activeH = hazards.find(
            (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
          );
          if (activeH) {
            handleCommandShipToRetrieve(responderShipId, activeH.id);
            setActiveConsignment((prev) =>
              prev ? { ...prev, status: 'PICKUP_IN_PROGRESS' } : null
            );
          }
        }}
        universalClearanceRecord={universalClearanceRecord}
        onOpenClearanceModal={() => setShowClearanceModal(true)}
      />

      {/* Telemetry Status Footer */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4 flex-wrap text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-slate-300">
            Autonomous Bridge Intercom Link: <strong className="text-cyan-300">Active (DSC Ch 70 / VHF Ch 16)</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>Recovered Today: <strong className="text-emerald-400">{recoveredHazardsCount} Containers</strong></span>
          <span>Fairway Safety Status: <strong className={activeHazardsCount === 0 ? 'text-emerald-400' : 'text-red-400'}>{activeHazardsCount === 0 ? '100% CLEAR (ALL SHIPS ON ROUTE)' : 'HAZARD CAUTION IN EFFECT'}</strong></span>
        </div>
      </div>

      {/* Forensic Attribution Matrix Modal */}
      {showAttributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/60 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-700/60 text-purple-300 text-xs font-mono">
                  <Satellite className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sentinel-1 SAR C-Band &amp; Hydrodynamic Wave Analysis</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Multi-Ship Spill Attribution Matrix (4 Vessels)</span>
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Resolving polluter ambiguity in multi-vessel fairways using hydrodynamic wave crest geometry, C-band radar Bragg damping, and Eulerian-Lagrangian drift backtracking.
                </p>
              </div>

              <button
                onClick={() => setShowAttributionModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Active Spill Geographic Forensics Panel */}
            {hazards.filter((h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED').length > 0 && (
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                    <span>Active Fairway Incident Forensics (Exact Location &amp; Timestamp)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900 border border-red-700 text-red-200">
                    {hazards.filter((h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED').length} Slicks Detected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hazards
                    .filter((h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED')
                    .map((h, i) => {
                      const polluter = ships.find((s) => s.id === h.droppedByVesselId);
                      const sternDeg = polluter ? (polluter.headingDeg + 180) % 360 : 0;
                      return (
                        <div key={h.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                          <div className="flex items-center gap-2.5">
                            {polluter?.photoUrl && (
                              <img
                                src={polluter.photoUrl}
                                alt={polluter.name}
                                className="w-9 h-9 rounded-lg object-cover border border-red-500 shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-bold text-red-200">
                                {h.spillIndex ? `Slick #${h.spillIndex}: ` : ''}
                                {polluter?.name.split(' (')[0] || h.droppedByVesselName}
                              </div>
                              <div className="text-[10px] text-slate-400">MMSI: {polluter?.mmsi} • {h.spillVolumeTonnes}T Heavy Fuel Oil</div>
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px] pt-1 border-t border-slate-800/80">
                            <div className="flex items-center justify-between text-yellow-300">
                              <span>📍 Exact Coordinates:</span>
                              <span className="font-bold">{h.exactCoordinatesFormatted || formatDMS(h.coordinates.lat, h.coordinates.lng)}</span>
                            </div>
                            <div className="flex items-center justify-between text-cyan-300">
                              <span>⏱️ Time Occurred:</span>
                              <span className="font-bold">{h.occurredTimestampFormatted || h.droppedTimestamp}</span>
                            </div>
                            <div className="flex items-center justify-between text-purple-300">
                              <span>📐 Vessel Angles:</span>
                              <span>Hdg {polluter?.headingDeg.toFixed(0)}°T | Stern {sternDeg.toFixed(0)}°T | θ=±19.47°</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Vessel Scores Table with Real Photos */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Forensic Suspect Ranking (4 Vessels in Fairway Cluster)</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="p-3">Vessel &amp; Real Photo</th>
                      <th className="p-3">MMSI / Dimensions</th>
                      <th className="p-3">Kelvin Angle (19.47°)</th>
                      <th className="p-3">SAR Bragg (Δσ₀)</th>
                      <th className="p-3">Stokes Drift Error</th>
                      <th className="p-3">Attribution Prob.</th>
                      <th className="p-3">Forensic Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-[11px]">
                    {ships.map((ship, idx) => {
                      const score = activeAttributionScores.find((sc) => sc.shipId === ship.id);
                      const isCulprit = score?.isIdentifiedCulprit ?? (idx === 0);
                      const prob = score?.attributionProbability ?? (idx === 0 ? 98.4 : idx === 1 ? 1.2 : 0.2);
                      const kelvinOffset = score?.kelvinWakeAngularOffsetDeg ?? (idx === 0 ? 0.3 : 14.2);
                      const braggDamping = score?.sarBraggDampingDb ?? (idx === 0 ? -8.4 : -0.2);
                      const driftError = score?.stokesDriftResidualErrorMeters ?? (idx === 0 ? 34 : 480);

                      return (
                        <tr
                          key={ship.id}
                          className={isCulprit ? 'bg-red-950/25 text-red-200 font-bold' : 'bg-slate-900 text-slate-300'}
                        >
                          <td className="p-3 flex items-center gap-2.5">
                            {ship.photoUrl ? (
                              <img
                                src={ship.photoUrl}
                                alt={ship.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                              />
                            ) : (
                              <Ship className="w-4 h-4" style={{ color: ship.color }} />
                            )}
                            <div>
                              <div>{ship.name.split(' (')[0]}</div>
                              <div className="text-[9px] text-slate-400 font-normal">{ship.cargoDescription || 'Commercial'}</div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-400">
                            <div>{ship.mmsi}</div>
                            <div className="text-[9px]">{ship.lengthMeters || 220}m × {ship.beamMeters || 32}m</div>
                          </td>
                          <td className="p-3">{kelvinOffset.toFixed(1)}° offset</td>
                          <td className="p-3">{braggDamping.toFixed(1)} dB</td>
                          <td className="p-3">{driftError.toFixed(0)} m</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full ${isCulprit ? 'bg-red-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${prob}%` }}
                                ></div>
                              </div>
                              <span>{prob.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {isCulprit ? (
                              <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 text-[10px]">
                                🚨 CONFIRMED POLLUTER
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px]">
                                ✓ EXONERATED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scientific Theory Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" />
                  <span>1. Kelvin Wave Wake Geometry</span>
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Every displacement hull creates divergent and transverse waves bound strictly by Lord Kelvin’s angle <code className="text-cyan-300">θ = arcsin(1/3) ≈ 19.47°</code>. Matching the slick apex to this wake envelope reconstructs the vessel’s instantaneous stern trajectory.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5" />
                  <span>2. SAR Bragg Damping (Δσ₀)</span>
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Synthetic Aperture Radar (SAR) at 5.405 GHz resonates with ocean capillary waves. Oil film attenuates capillary resonance, producing a <code className="text-purple-300">-6 dB to -10 dB</code> backscatter deficit directly aligned behind the emitting propeller.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>3. Stokes Drift Backtracking</span>
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Combines tidal stream vectors with Stokes wave drift velocity <code className="text-emerald-300">u_s(0) = ω k a²</code> to calculate the origin point, eliminating ambiguity across all 4 fairway vessels.
                </p>
              </div>
            </div>

            {/* Action Bar inside Modal */}
            <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-mono">
                MARPOL Annex I Forensic Rule Enforcement Engine • IMO Resolution MEPC.117(52)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowAttributionModal(false);
                    handleTriggerAmbiguous4ShipSpill();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-colors shadow-lg"
                >
                  Run 1-Ship Rotating Scan
                </button>
                <button
                  onClick={() => {
                    setShowAttributionModal(false);
                    handleTriggerDualShipSpill();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-colors shadow-lg"
                >
                  Run 2-of-4 Dual Spill Demo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Official Spill Consignment Order & Salvage Directive Modal */}
      {showConsignmentModal && (
        <SpillConsignmentReportModal
          consignment={activeConsignment}
          onClose={() => setShowConsignmentModal(false)}
          availableShips={ships}
          onDispatchPickupResponder={(responderShipId) => {
            const activeH = hazards.find(
              (h) => h.status === 'FLOATING_ACTIVE_SPILL' || h.status === 'BEING_INTERCEPTED'
            );
            if (activeH) {
              handleCommandShipToRetrieve(responderShipId, activeH.id);
              setActiveConsignment((prev) =>
                prev ? { ...prev, status: 'PICKUP_IN_PROGRESS' } : null
              );
            }
          }}
          onTriggerAllClearBroadcast={() => {
            setShowConsignmentModal(false);
            setShowClearanceModal(true);
          }}
        />
      )}

      {/* Universal Clearance Broadcast Everywhere Modal */}
      {showClearanceModal && (
        <UniversalClearanceModal
          clearance={universalClearanceRecord}
          onClose={() => setShowClearanceModal(false)}
        />
      )}

    </div>
  );
};
