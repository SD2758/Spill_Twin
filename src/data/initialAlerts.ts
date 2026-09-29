import { EarlyWarningAlert } from '../types';

export const INITIAL_EARLY_WARNING_ALERTS: EarlyWarningAlert[] = [
  {
    id: 'ALERT-IND-MUM-2026-0902-01',
    alertCode: 'ICG-POLL-2026-WZ-041',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    formattedTime: '18 minutes ago (Live Radar Pass)',
    severity: 'CRITICAL_SPILL',
    targetSector: {
      id: 'india-mumbai-high-offshore',
      name: 'Mumbai High Offshore & JNPT Fairway',
      region: 'INDIA',
      lat: 18.9142,
      lng: 72.4820,
      subZone: 'West Coast - Maharashtra Offshore (Arabian Sea)',
    },
    satelliteMission: {
      satelliteName: 'Sentinel-1A C-SAR (Copernicus)',
      sensor: 'C-Band Active Microwave Radar (IW GRDH)',
      passTime: 'Today, 03:45 UTC',
      orbitType: 'Descending',
      resolutionMeters: 10.0,
      polarization: 'VV + VH',
    },
    detectionDetails: {
      slickAreaKm2: 4.85,
      estimatedVolumeTonnes: 420,
      estimatedVolumeM3: 495,
      confidenceScore: 97.4,
      dampingRatioDb: 8.9,
      contrastRatioDb: -9.2,
      hydrocarbonType: 'Heavy Crude',
      suspectVessel: {
        name: 'M/T ARABIAN LOTUS',
        mmsi: '419001924',
        imo: '9482104',
        flag: 'Liberia',
        type: 'Crude Oil Tanker (Aframax, 115,000 DWT)',
        speedKnots: 11.4,
        headingDeg: 138,
        distanceFromOriginKm: 2.1,
      },
      metocean: {
        windSpeedMps: 6.8,
        windDirDeg: 305,
        currentSpeedMps: 0.55,
        currentDirDeg: 140,
        waveHeightMeters: 1.4,
      },
      driftEtaHoursToShore: 14.2,
      threatenedCoastline: 'Alibag / Colaba Coastal Mangroves & Fishery Zone (Maharashtra)',
      slickPolygonCoords: [
        [
          [72.465, 18.928],
          [72.492, 18.935],
          [72.510, 18.905],
          [72.482, 18.895],
          [72.465, 18.928],
        ],
      ],
    },
    dispatches: [
      {
        id: 'disp-sms-01',
        channel: 'SMS',
        recipient: '+91-98200-XXXXX (Coast Guard MRCC Mumbai / Ops Officer)',
        status: 'DELIVERED',
        sentAt: '17 mins ago',
        messageBody:
          '🚨 [EMERGENCY SPILL ALERT] SpillTwin SAR Sentinel: Heavy crude oil slick detected in MUMBAI OFFSHORE SECTOR (18.91°N, 72.48°E). Area: 4.85 km² (~420 Tonnes). Suspect: M/T ARABIAN LOTUS (MMSI: 419001924, IMO: 9482104). Surface drift: 0.55 m/s towards SE (Alibag/Colaba coast, ETA 14.2h). Immediate Tier-2 boom containment recommended. Ref: ICG-POLL-2026-WZ-041.',
        carrierReceiptId: 'SMS-IND-VOD-992104',
      },
      {
        id: 'disp-email-01',
        channel: 'EMAIL',
        recipient: 'mrcc-mumbai@indiancoastguard.nic.in, pollution.response@dgshipping.gov.in',
        status: 'DELIVERED',
        sentAt: '17 mins ago',
        messageBody:
          'OFFICIAL MARPOL INCIDENT SITREP: Satellite SAR detection of 4.85 km² heavy crude slick at Mumbai Offshore Fairway. Backtracking indicates transponder gap anomaly on Aframax crude tanker M/T ARABIAN LOTUS. Metocean drift forecast shows shoreline intersection within 14.2 hours.',
        carrierReceiptId: 'MAIL-GOV-IND-448102',
      },
      {
        id: 'disp-webhook-01',
        channel: 'WEBHOOK',
        recipient: 'https://eoc-gateway.maritime.gov.in/api/v1/incidents/spilltwin',
        status: 'ACKNOWLEDGED',
        sentAt: '16 mins ago',
        messageBody: 'JSON payload with GeoJSON bounding polygon and 24h hydrodynamic particle trajectory.',
      },
      {
        id: 'disp-radio-01',
        channel: 'ICG_MARPOL_DISPATCH',
        recipient: 'VHF Ch 16 / NAVTEX Broadcast Mumbai Coastal Radio (VWB)',
        status: 'TRANSMITTED',
        sentAt: '15 mins ago',
        messageBody: 'SECURITE SECURITE SECURITE. ALL SHIPS NAVIGATING MUMBAI HIGH - AVOID POLLUTED FAIRWAY BOUNDS.',
      },
    ],
    recommendedAction:
      'Task ICG pollution control vessel ICGS Samudra Prahari with dynamic disc skimmers and deploy containment boom 2.5 km upstream of Alibag fishery zone.',
    icgMaritimeReportMarkdown: `### INDIAN COAST GUARD POLLUTION INCIDENT SITREP (POLREP)
**Incident Identifier:** ICG-POLL-2026-WZ-041
**Region:** Western Seaboard — Mumbai Offshore Maritime Zone
**Detection Time:** Today, 03:45 UTC | Sensor: Spaceborne Sentinel-1A C-SAR

#### 1. SATELLITE RADAR CONFIRMATION
- **Surface Bragg Attenuation:** -8.9 dB (High dampening indicates heavy hydrocarbon)
- **Slick Geometry:** Elongated asymmetric plume spanning 4.85 km² (~495 m³ volume)
- **Centroid:** [18.9142° N, 72.4820° E] (12.4 NM WSW of Gateway of India)

#### 2. VESSEL OF INTEREST (AIS BACKTRACKING)
- **Target Vessel:** M/T ARABIAN LOTUS (Aframax Tanker, Flag: Liberia, MMSI: 419001924, IMO: 9482104)
- **Transponder Anomaly:** 42-minute speed deceleration (14.2 kn to 7.1 kn) coinciding with slick head coordinates.

#### 3. HYDRODYNAMIC DRIFT & CONTAINMENT DIRECTIVES
- **Current / Wind Vectors:** 0.55 m/s @ 140° SE | Wind: 6.8 m/s NW
- **Estimated Coastline Landfall:** 14.2 hours to Alibag coastal strip
- **Action:** Dispatch ICGS Samudra Prahari with containment booms and chemical dispersant aircraft.`,
    acknowledged: false,
  },
  {
    id: 'ALERT-IND-KUTCH-2026-0902-02',
    alertCode: 'ICG-POLL-2026-WZ-042',
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    formattedTime: '52 minutes ago',
    severity: 'HIGH_ALERT',
    targetSector: {
      id: 'india-gulf-of-kutch-jamnagar',
      name: 'Gulf of Kutch & Jamnagar Vadinar Marine Corridor',
      region: 'INDIA',
      lat: 22.4820,
      lng: 69.7540,
      subZone: 'West Coast - Gujarat Exclusive Economic Zone',
    },
    satelliteMission: {
      satelliteName: 'ISRO EOS-06 (Oceansat-3) + Sentinel-1B',
      sensor: 'Ocean Color Monitor-3 (OCM-3) + C-SAR Radar',
      passTime: 'Today, 03:10 UTC',
      orbitType: 'Descending',
      resolutionMeters: 12.5,
      polarization: 'VV',
    },
    detectionDetails: {
      slickAreaKm2: 2.15,
      estimatedVolumeTonnes: 180,
      estimatedVolumeM3: 210,
      confidenceScore: 92.1,
      dampingRatioDb: 7.6,
      contrastRatioDb: -7.8,
      hydrocarbonType: 'Bunker Fuel Oil',
      suspectVessel: {
        name: 'M/V GUJARAT GLORY',
        mmsi: '419000812',
        imo: '9320145',
        flag: 'India',
        type: 'Bulk Carrier (55,000 DWT)',
        speedKnots: 8.6,
        headingDeg: 82,
        distanceFromOriginKm: 1.4,
      },
      metocean: {
        windSpeedMps: 7.2,
        windDirDeg: 280,
        currentSpeedMps: 0.85,
        currentDirDeg: 95,
        waveHeightMeters: 1.2,
      },
      driftEtaHoursToShore: 9.8,
      threatenedCoastline: 'Marine National Park & Sanctuary (Narara Mangrove Island, Jamnagar)',
      slickPolygonCoords: [
        [
          [69.735, 22.490],
          [69.765, 22.495],
          [69.775, 22.470],
          [69.745, 22.465],
          [69.735, 22.490],
        ],
      ],
    },
    dispatches: [
      {
        id: 'disp-sms-02',
        channel: 'SMS',
        recipient: '+91-98795-XXXXX (GPCB Marine Vigilance / Jamnagar Port Master)',
        status: 'DELIVERED',
        sentAt: '50 mins ago',
        messageBody:
          '⚠️ [URGENT SPILL ALERT] Gulf of Kutch Vadinar SPM Channel: Bunker fuel slick detected (~2.15 km² / 180 T). Tidal current pushing east towards Narara Marine Sanctuary (ETA 9.8h). Suspect: M/V GUJARAT GLORY (MMSI: 419000812). Ref: ICG-POLL-2026-WZ-042.',
        carrierReceiptId: 'SMS-IND-AIR-881023',
      },
      {
        id: 'disp-email-02',
        channel: 'EMAIL',
        recipient: 'icg-kandla@indiancoastguard.nic.in, portmaster@deendayalport.gov.in',
        status: 'DELIVERED',
        sentAt: '50 mins ago',
        messageBody:
          'KUTCH MARINE SANCTUARY CONTINGENCY: Satellite EOS-06 & SAR pass detects 2.15 km² bunker discharge along Vadinar Single Point Mooring channel. High ecological vulnerability.',
      },
    ],
    recommendedAction:
      'Activate Gulf of Kutch Tier-1 Oil Spill Response Plan. Deploy Deendayal Port skimming barges and protect Narara reef with absorbent booms.',
    icgMaritimeReportMarkdown: `### POLLUTION ALERT — GULF OF KUTCH / VADINAR FAIRWAY
**Incident Identifier:** ICG-POLL-2026-WZ-042
**Location:** 22.4820° N, 69.7540° E (Approach to Jamnagar SPM & Deendayal Port)
**Threat Level:** High Ecological Priority (Coral & Mangrove Marine Sanctuary buffer)`,
    acknowledged: true,
    acknowledgedBy: 'Commander ICG District HQ No. 1 (Porbandar/Vadinar)',
    acknowledgedAt: '40 mins ago',
  },
  {
    id: 'ALERT-GLO-HOR-2026-0902-03',
    alertCode: 'IMO-MARPOL-GLO-2026-88',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    formattedTime: '1 hr 50 mins ago',
    severity: 'CRITICAL_SPILL',
    targetSector: {
      id: 'global-strait-of-hormuz',
      name: 'Strait of Hormuz & Persian Gulf Fairway',
      region: 'GLOBAL',
      lat: 26.3480,
      lng: 56.4020,
      subZone: 'Middle East - Persian Gulf / Gulf of Oman',
    },
    satelliteMission: {
      satelliteName: 'Sentinel-1A C-SAR + COSMO-SkyMed',
      sensor: 'X-band & C-band Combined SAR Constellation',
      passTime: 'Today, 02:15 UTC',
      orbitType: 'Ascending',
      resolutionMeters: 5.0,
      polarization: 'VV + VH',
    },
    detectionDetails: {
      slickAreaKm2: 8.40,
      estimatedVolumeTonnes: 760,
      estimatedVolumeM3: 890,
      confidenceScore: 98.9,
      dampingRatioDb: 10.4,
      contrastRatioDb: -11.5,
      hydrocarbonType: 'Heavy Crude',
      suspectVessel: {
        name: 'M/T GULF VALOR',
        mmsi: '636018933',
        imo: '9650912',
        flag: 'Marshall Islands',
        type: 'VLCC Crude Oil Tanker (300,000 DWT)',
        speedKnots: 13.8,
        headingDeg: 142,
        distanceFromOriginKm: 3.8,
      },
      metocean: {
        windSpeedMps: 6.8,
        windDirDeg: 315,
        currentSpeedMps: 0.45,
        currentDirDeg: 135,
        waveHeightMeters: 1.1,
      },
      driftEtaHoursToShore: 22.0,
      threatenedCoastline: 'Musandam Peninsula (Oman) / Fujairah Bunkering Anchorage',
      slickPolygonCoords: [
        [
          [56.380, 26.365],
          [56.430, 26.375],
          [56.445, 26.325],
          [56.395, 26.315],
          [56.380, 26.365],
        ],
      ],
    },
    dispatches: [
      {
        id: 'disp-sms-03',
        channel: 'SMS',
        recipient: '+971-50-XXXXXXX (UAE Coast Guard & Fujairah Port Control)',
        status: 'DELIVERED',
        sentAt: '1 hr 45 mins ago',
        messageBody:
          '🚨 [CRITICAL SPILL ALERT] Strait of Hormuz Inbound TSS: Major heavy crude slick detected (8.4 km² / ~760 T). Suspect: VLCC M/T GULF VALOR (MMSI: 636018933). Ref: IMO-MARPOL-GLO-2026-88.',
        carrierReceiptId: 'SMS-UAE-ETI-330192',
      },
      {
        id: 'disp-email-03',
        channel: 'EMAIL',
        recipient: 'mepc@imo.org, operations@memac-rsa.org',
        status: 'DELIVERED',
        sentAt: '1 hr 45 mins ago',
        messageBody: 'INTERNATIONAL MARPOL ALERT: VLCC illicit tank washing / bilge discharge detected in Strait of Hormuz TSS fairway.',
      },
    ],
    recommendedAction:
      'Broadcast navigation warning to Strait of Hormuz Traffic Separation Scheme. Task regional MEMAC anti-pollution tugs for offshore mechanical recovery.',
    icgMaritimeReportMarkdown: `### INTERNATIONAL MARPOL ANNEX I ALERT
**Chokepoint:** Strait of Hormuz — Traffic Separation Scheme (TSS)
**Slick Volume:** ~760 Metric Tonnes Heavy Crude | Footprint: 8.4 km²`,
    acknowledged: true,
    acknowledgedBy: 'MEMAC Maritime Emergency Mutual Aid Centre (Bahrain)',
    acknowledgedAt: '1 hr 30 mins ago',
  },
];
