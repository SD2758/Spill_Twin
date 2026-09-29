/**
 * Service for Ship-to-Ship (V2V) Intercom, VHF Radio Simulation, and Joint Spill Resolution
 */

import { ShipCoordinationScenario, RadioMessage, ResolutionPhase, V2VVessel } from '../types/shipCoordination';
import { OperatorAuthService } from './operatorAuthService';

class ShipIntercomAudio {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  // Play VHF mic squelch / static radio click
  playVhfClick() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // 1. Noise burst (Radio Static)
      const bufferSize = this.audioCtx.sampleRate * 0.08; // 80ms burst
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.25;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      whiteNoise.start(now);

      // 2. High chirp tone (Mic release tone)
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now + 0.03);
      oscGain.gain.setValueAtTime(0.15, now + 0.03);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);
      osc.start(now + 0.03);
      osc.stop(now + 0.08);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Play DSC alarm beep (Digital Selective Calling alert)
  playDscAlarm() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1300, now);
      osc.frequency.setValueAtTime(2100, now + 0.1);
      osc.frequency.setValueAtTime(1300, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const shipAudio = new ShipIntercomAudio();

export const INITIAL_V2V_SCENARIOS: ShipCoordinationScenario[] = [
  {
    id: 'scen-container-mumbai',
    title: 'M/V PACIFIC CORAL (18,000 TEU Container Carrier) - Bunker Tank 3P Breach',
    locationName: 'Mumbai High Fairway (18.92° N, 72.35° E)',
    incidentType: 'Severe Heavy Fuel Oil (HFO 380) Bunker Rupture',
    initialSpillTonnes: 120,
    hydrocarbonType: 'Heavy Fuel Oil (HFO-380 cSt)',
    seaConditions: 'Wind 14 kts NW, Current 0.8 kts SE, Wave Height 1.4m',
    casualtyVessel: {
      id: 'vessel-pacific-coral',
      name: 'M/V PACIFIC CORAL',
      callsign: '9V8921',
      mmsi: '563012980',
      imo: '9812345',
      flag: 'Singapore (Ultra Large Container Vessel)',
      vesselType: 'CONTAINER_CARRIER',
      role: 'CASUALTY',
      captainName: 'Capt. Henrik Lindqvist',
      coordinates: { lat: 18.92, lng: 72.35 },
      headingDeg: 165,
      speedKnots: 2.1,
      distanceNmToCasualty: 0,
      bearingDegToCasualty: 0,
      vhfChannel: 16,
      dscStatus: 'CARRIER_LOCKED',
      equipmentOnBoard: {
        boomLengthMeters: 150,
        skimmerCapacityM3h: 15,
        stsTransferHoses: true,
        pneumaticFenders: 2,
        dispersantLitres: 400,
        oilStorageCapacityM3: 40,
      },
      hullStatus: {
        leakSource: 'Port Fuel Bunker Tank No. 3 (Double Bottom Fracture)',
        cargoOrFuelType: 'Heavy Fuel Oil HFO 380',
        remainingTonnesAtRisk: 520,
        initialSpillVolumeTonnes: 120,
        currentOutflowRateM3h: 12.4,
        listDegrees: 2.8,
        containmentProgressPct: 15,
        activeAction: 'Slow steaming, requesting immediate boom cordon and STS pump assist.',
      },
    },
    nearbyVessels: [
      {
        id: 'vessel-icgs-samudra-pavak',
        name: 'ICGS SAMUDRA PAVAK (CG-202)',
        callsign: 'VWSP',
        mmsi: '419001420',
        imo: '9582100',
        flag: 'Indian Coast Guard Pollution Response Vessel',
        vesselType: 'POLLUTION_RESPONSE_VESSEL',
        role: 'COAST_GUARD',
        captainName: 'Commandant Arunav Mukherjee',
        coordinates: { lat: 18.98, lng: 72.28 },
        headingDeg: 140,
        speedKnots: 22.0,
        distanceNmToCasualty: 4.8,
        bearingDegToCasualty: 142,
        vhfChannel: 16,
        dscStatus: 'ONLINE',
        equipmentOnBoard: {
          boomLengthMeters: 1200,
          skimmerCapacityM3h: 300,
          stsTransferHoses: true,
          pneumaticFenders: 6,
          dispersantLitres: 12000,
          oilStorageCapacityM3: 500,
        },
        hullStatus: {
          initialSpillVolumeTonnes: 0,
          currentOutflowRateM3h: 0,
          listDegrees: 0,
          containmentProgressPct: 100,
          activeAction: 'En route at flank speed with 1200m offshore heavy Ro-Boom ready for deployment.',
        },
      },
      {
        id: 'vessel-tug-ocean-guardian',
        name: 'M/T OCEAN GUARDIAN (Escort Tug)',
        callsign: 'ATOG',
        mmsi: '419992310',
        imo: '9710340',
        flag: 'Indian Port Trust Heavy Salvage Tug',
        vesselType: 'ESCORT_TUG',
        role: 'ESCORT_TUG',
        captainName: 'Capt. Rajesh Patil',
        coordinates: { lat: 18.89, lng: 72.39 },
        headingDeg: 320,
        speedKnots: 14.5,
        distanceNmToCasualty: 2.9,
        bearingDegToCasualty: 318,
        vhfChannel: 16,
        dscStatus: 'ONLINE',
        equipmentOnBoard: {
          boomLengthMeters: 600,
          skimmerCapacityM3h: 80,
          stsTransferHoses: true,
          pneumaticFenders: 4,
          dispersantLitres: 3000,
          oilStorageCapacityM3: 150,
        },
        hullStatus: {
          initialSpillVolumeTonnes: 0,
          currentOutflowRateM3h: 0,
          listDegrees: 0,
          containmentProgressPct: 100,
          activeAction: 'Standing by to secure trailing boom end for J-formation sweep.',
        },
      },
      {
        id: 'vessel-strait-falcon',
        name: 'M/V STRAIT FALCON (Container Ship)',
        callsign: 'C6ZW2',
        mmsi: '311000492',
        imo: '9785501',
        flag: 'Bahamas (Post-Panamax Sister Container Vessel)',
        vesselType: 'CONTAINER_CARRIER',
        role: 'ASSISTING_RESPONDER',
        captainName: 'Capt. Daniel Mercer',
        coordinates: { lat: 18.84, lng: 72.42 },
        headingDeg: 340,
        speedKnots: 8.0,
        distanceNmToCasualty: 6.4,
        bearingDegToCasualty: 335,
        vhfChannel: 16,
        dscStatus: 'ONLINE',
        equipmentOnBoard: {
          boomLengthMeters: 300,
          skimmerCapacityM3h: 20,
          stsTransferHoses: true,
          pneumaticFenders: 4,
          dispersantLitres: 800,
          oilStorageCapacityM3: 600,
        },
        hullStatus: {
          initialSpillVolumeTonnes: 0,
          currentOutflowRateM3h: 0,
          listDegrees: 0,
          containmentProgressPct: 100,
          activeAction: 'Maneuvering to lee side for emergency fuel transfer / STS assist.',
        },
      },
    ],
    phases: [
      {
        id: 1,
        code: 'PHASE-1-SOURCE-ISOLATION',
        title: 'Phase 1: Emergency Speed Reduction & Inboard Bunker Counter-Pumping',
        description: 'Casualty container ship reduces speed to 2 knots, trims vessel to lift damaged Bunker Tank 3P above waterline, and engages internal high-capacity ballast transfer pumps.',
        requiredVessels: ['M/V PACIFIC CORAL'],
        equipmentRequired: 'Internal Ship Pumping System & High-Torque Bilge Separator',
        reductionPercentage: 25,
        status: 'PENDING',
      },
      {
        id: 2,
        code: 'PHASE-2-DUAL-BOOM-SWEEP',
        title: 'Phase 2: Joint J-Formation Boom Deployment & Encirclement',
        description: 'ICGS Samudra Pavak and Tug Ocean Guardian hook up 1200m heavy-duty ocean Ro-Boom, sweeping in parallel J-formation 300 meters behind the leaking stern.',
        requiredVessels: ['ICGS SAMUDRA PAVAK', 'M/T OCEAN GUARDIAN'],
        equipmentRequired: '1200m Inflatable Ocean Ro-Boom + Towing Bridles',
        reductionPercentage: 30,
        status: 'PENDING',
      },
      {
        id: 3,
        code: 'PHASE-3-HIGH-VOLUME-SKIMMING',
        title: 'Phase 3: Dual Oleophilic Disc & Brush Skimming into Sump Tanks',
        description: 'Coast Guard and Tug deploy 300 m³/hr weir and brush skimmers directly inside the boom apex, recovering emulsified heavy fuel oil at 240 m³/hr.',
        requiredVessels: ['ICGS SAMUDRA PAVAK', 'M/T OCEAN GUARDIAN'],
        equipmentRequired: 'Lamor Free-Floating Brush Skimmers + Sump Transfer Manifolds',
        reductionPercentage: 25,
        status: 'PENDING',
      },
      {
        id: 4,
        code: 'PHASE-4-STS-FUEL-LIGHTERING',
        title: 'Phase 4: Ship-to-Ship (STS) Emergency Fuel Lightering Assist',
        description: 'M/V Strait Falcon / Assisting Tanker moors alongside casualty vessel with 4 large Yokohama pneumatic fenders, transferring 480 tonnes of remaining bunker fuel to eliminate further spill risk.',
        requiredVessels: ['M/V PACIFIC CORAL', 'M/V STRAIT FALCON'],
        equipmentRequired: 'Yokohama Pneumatic Fenders + 10-inch STS Cargo Hoses + Nitrogen Inerting',
        reductionPercentage: 15,
        status: 'PENDING',
      },
      {
        id: 5,
        code: 'PHASE-5-AERIAL-SAR-CLEARANCE',
        title: 'Phase 5: Eco-Dispersant Polishing & Copernicus Sentinel-1 SAR Verification',
        description: 'Final application of IMO-certified biodegradable dispersant on residual micro-sheen. Verified clean and clear by Copernicus Sentinel-1 radar pass.',
        requiredVessels: ['ICGS SAMUDRA PAVAK', 'M/V PACIFIC CORAL'],
        equipmentRequired: 'Aerator Spray Booms + Sentinel-1 C-SAR Radar Downlink',
        reductionPercentage: 5,
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'scen-tanker-kutch',
    title: 'M/T BHARAT SAMUDRA (VLCC Crude Tanker) - Cargo Piping Flange Failure',
    locationName: 'Gulf of Kutch Deep Water Fairway (22.58° N, 69.18° E)',
    incidentType: 'Arabian Heavy Crude Oil Cargo Line Rupture',
    initialSpillTonnes: 210,
    hydrocarbonType: 'Arabian Heavy Crude Oil (API 27.9°)',
    seaConditions: 'Wind 18 kts WSW, Tidal Current 2.1 kts ENE, Wave Height 1.8m',
    casualtyVessel: {
      id: 'vessel-bharat-samudra',
      name: 'M/T BHARAT SAMUDRA',
      callsign: 'AVBS',
      mmsi: '419001880',
      imo: '9745120',
      flag: 'India (Very Large Crude Carrier - VLCC)',
      vesselType: 'CRUDE_TANKER',
      role: 'CASUALTY',
      captainName: 'Capt. Vikramaditya Sen',
      coordinates: { lat: 22.58, lng: 69.18 },
      headingDeg: 75,
      speedKnots: 1.2,
      distanceNmToCasualty: 0,
      bearingDegToCasualty: 0,
      vhfChannel: 16,
      dscStatus: 'CARRIER_LOCKED',
      equipmentOnBoard: {
        boomLengthMeters: 400,
        skimmerCapacityM3h: 50,
        stsTransferHoses: true,
        pneumaticFenders: 4,
        dispersantLitres: 2000,
        oilStorageCapacityM3: 800,
      },
      hullStatus: {
        leakSource: 'Cargo Manifold No. 4 Starboard Flange Gasket',
        cargoOrFuelType: 'Crude Oil (Arabian Heavy)',
        remainingTonnesAtRisk: 1400,
        initialSpillVolumeTonnes: 210,
        currentOutflowRateM3h: 22.0,
        listDegrees: 1.2,
        containmentProgressPct: 10,
        activeAction: 'Emergency cargo ESD tripped. Requesting port tugs and skimmers on VHF 16.',
      },
    },
    nearbyVessels: [
      {
        id: 'vessel-kandla-fire-tug',
        name: 'TUG KANDLA STAR (DPA Marine Fire & Pollution Tug)',
        callsign: 'ATKS',
        mmsi: '419112004',
        imo: '9654312',
        flag: 'Deendayal Port Authority Emergency Tug',
        vesselType: 'ESCORT_TUG',
        role: 'ESCORT_TUG',
        captainName: 'Capt. Harpreet Singh',
        coordinates: { lat: 22.62, lng: 69.25 },
        headingDeg: 245,
        speedKnots: 16.0,
        distanceNmToCasualty: 3.5,
        bearingDegToCasualty: 248,
        vhfChannel: 16,
        dscStatus: 'ONLINE',
        equipmentOnBoard: {
          boomLengthMeters: 800,
          skimmerCapacityM3h: 150,
          stsTransferHoses: true,
          pneumaticFenders: 4,
          dispersantLitres: 6000,
          oilStorageCapacityM3: 200,
        },
        hullStatus: {
          initialSpillVolumeTonnes: 0,
          currentOutflowRateM3h: 0,
          listDegrees: 0,
          containmentProgressPct: 100,
          activeAction: 'Deploying dynamic containment boom around starboard quarter.',
        },
      },
    ],
    phases: [
      {
        id: 1,
        code: 'PHASE-1-VALVE-ISOLATION',
        title: 'Phase 1: ESD Emergency Shutdown & Nitrogen Inerting',
        description: 'Activate emergency hydraulic shut-off valves across Cargo Manifold No. 4 and purge leaking line with nitrogen gas.',
        requiredVessels: ['M/T BHARAT SAMUDRA'],
        equipmentRequired: 'Hydraulic Quick-Closing Valves & Inert Gas System',
        reductionPercentage: 30,
        status: 'PENDING',
      },
      {
        id: 2,
        code: 'PHASE-2-PORT-BOOMING',
        title: 'Phase 2: High-Current Tidal Boom Deployment',
        description: 'Tug Kandla Star deploys high-tension tidal boom to trap high-viscosity crude before entering sensitive mangrove creeks.',
        requiredVessels: ['TUG KANDLA STAR'],
        equipmentRequired: 'High-Current Ro-Fence 800m',
        reductionPercentage: 35,
        status: 'PENDING',
      },
      {
        id: 3,
        code: 'PHASE-3-CRUDE-SKIMMING',
        title: 'Phase 3: Oleophilic Drum Skimming & Sludge Suction',
        description: 'Direct suction of thick crude into port reception barges.',
        requiredVessels: ['TUG KANDLA STAR', 'M/T BHARAT SAMUDRA'],
        equipmentRequired: 'Oleophilic Drum Skimmers (150 m³/h)',
        reductionPercentage: 25,
        status: 'PENDING',
      },
      {
        id: 4,
        code: 'PHASE-4-FINAL-CLEARANCE',
        title: 'Phase 4: Environmental Inspection & Clean Channel Sign-Off',
        description: 'INCOIS hazard modeling and Sentinel-1 verification confirming complete containment.',
        requiredVessels: ['M/T BHARAT SAMUDRA'],
        equipmentRequired: 'Sentinel-1 SAR Radar Telemetry',
        reductionPercentage: 10,
        status: 'PENDING',
      },
    ],
  },
];

export const INITIAL_RADIO_MESSAGES: Record<string, RadioMessage[]> = {
  'scen-container-mumbai': [
    {
      id: 'msg-01',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      istTime: new Date(Date.now() - 900000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      senderVesselId: 'vessel-pacific-coral',
      senderVesselName: 'M/V PACIFIC CORAL',
      senderRole: 'CASUALTY',
      senderRank: 'Master / Capt. Henrik Lindqvist',
      vhfChannel: 16,
      audioFrequencyMhz: 156.8,
      messageText: 'MAYDAY RELAY, MAYDAY RELAY. All ships in Mumbai High Offshore fairway. This is Container Ship PACIFIC CORAL (Callsign 9V8921). We have suffered a fuel bunker tank fracture at Tank 3P. Discharging Heavy Fuel Oil. Requesting immediate boom containment and STS assistance from all nearby vessels.',
      messageType: 'DISTRESS_MAYDAY',
      urgent: true,
    },
    {
      id: 'msg-02',
      timestamp: new Date(Date.now() - 720000).toISOString(),
      istTime: new Date(Date.now() - 720000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      senderVesselId: 'vessel-icgs-samudra-pavak',
      senderVesselName: 'ICGS SAMUDRA PAVAK',
      senderRole: 'COAST_GUARD',
      senderRank: 'Commandant Arunav Mukherjee',
      vhfChannel: 16,
      audioFrequencyMhz: 156.8,
      messageText: 'PACIFIC CORAL, this is ICGS SAMUDRA PAVAK. We acknowledge your distress call and have locked your AIS transponder. We are 4.8 miles north of your position steaming at 22 knots. We have 1200m heavy ocean boom and 300 m³/hr skimmers ready. Switching to VHF Channel 06 for tactical coordination.',
      messageType: 'TACTICAL_COORDINATION',
      urgent: true,
    },
    {
      id: 'msg-03',
      timestamp: new Date(Date.now() - 540000).toISOString(),
      istTime: new Date(Date.now() - 540000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      senderVesselId: 'vessel-tug-ocean-guardian',
      senderVesselName: 'M/T OCEAN GUARDIAN',
      senderRole: 'ESCORT_TUG',
      senderRank: 'Master / Capt. Rajesh Patil',
      vhfChannel: 6,
      audioFrequencyMhz: 156.3,
      messageText: 'SAMUDRA PAVAK and PACIFIC CORAL, this is Tug OCEAN GUARDIAN. We are 2.9 miles on your port quarter. We are ready to take the trailing towline from Samudra Pavak to form the J-formation boom barrier around Pacific Coral’s slick.',
      messageType: 'BOOM_DEPLOYMENT',
      urgent: false,
    },
    {
      id: 'msg-04',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      istTime: new Date(Date.now() - 300000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      senderVesselId: 'vessel-strait-falcon',
      senderVesselName: 'M/V STRAIT FALCON',
      senderRole: 'ASSISTING_RESPONDER',
      senderRank: 'Master / Capt. Daniel Mercer',
      vhfChannel: 6,
      audioFrequencyMhz: 156.3,
      messageText: 'PACIFIC CORAL, this is sister ship STRAIT FALCON. We are reducing speed and preparing Yokohama fenders on our starboard side. Our crew is rigging 10-inch cargo hoses for emergency STS fuel lightering as soon as the boom perimeter is secured.',
      messageType: 'STS_TRANSFER',
      urgent: false,
    },
  ],
};
