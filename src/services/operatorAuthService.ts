import { OperatorProfile, AuditActionLog, NearestShip, NearestCoastalStation, SatellitePowerBroadcastPayload } from '../types';

export const PRESET_OPERATORS: OperatorProfile[] = [
  {
    id: 'op-icg-mumbai-01',
    name: 'Commandant R. K. Sharma',
    organization: 'Indian Coast Guard (MRCC Mumbai)',
    stationId: 'MRCC-BOM-01',
    email: 'operations@mrcc-mumbai.gov.in',
    phoneNumber: '+91 98200 44910',
    role: 'Chief Incident Commander',
    loginTimestamp: new Date().toISOString(),
    badgeNumber: 'ICG-7741-BOM',
  },
  {
    id: 'op-incois-hyd-02',
    name: 'Dr. P. S. V. Rao',
    organization: 'INCOIS National Marine Hazards Lab',
    stationId: 'INCOIS-HYD-04',
    email: 'ocean-hazards@incois.gov.in',
    phoneNumber: '+91 94401 22890',
    role: 'Satellite SAR Specialist',
    loginTimestamp: new Date().toISOString(),
    badgeNumber: 'INCOIS-SCI-109',
  },
  {
    id: 'op-dgshipping-03',
    name: 'Captain Ananya Sen',
    organization: 'Directorate General of Shipping (Emergency Desk)',
    stationId: 'DG-SHIP-DEL-02',
    email: 'emergency@dgshipping.gov.in',
    phoneNumber: '+91 98110 55321',
    role: 'Port Controller',
    loginTimestamp: new Date().toISOString(),
    badgeNumber: 'DGS-NAVTEX-33',
  },
  {
    id: 'op-chennai-port-04',
    name: 'Officer Vikram Nair',
    organization: 'Chennai Port Trust Marine Operations',
    stationId: 'CPT-VTS-03',
    email: 'vts.chennai@chennaiport.gov.in',
    phoneNumber: '+91 98400 66782',
    role: 'Watchstander / Duty Officer',
    loginTimestamp: new Date().toISOString(),
    badgeNumber: 'VTS-CHN-882',
  },
];

const STORAGE_KEY_CURRENT_USER = 'spilltwin_active_operator_profile';
const STORAGE_KEY_SAVED_LOGINS = 'spilltwin_saved_login_profiles';
const STORAGE_KEY_AUDIT_LOGS = 'spilltwin_response_audit_logs';

export class OperatorAuthService {
  private static currentUser: OperatorProfile = PRESET_OPERATORS[0];
  private static auditLogs: AuditActionLog[] = [];

  public static initialize(): OperatorProfile {
    try {
      const savedUserJson = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedUserJson) {
        this.currentUser = JSON.parse(savedUserJson);
      } else {
        this.currentUser = PRESET_OPERATORS[0];
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
      }

      const savedAuditLogs = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (savedAuditLogs) {
        this.auditLogs = JSON.parse(savedAuditLogs);
      } else {
        // Initial bootstrap logs
        this.auditLogs = [
          {
            id: `log-${Date.now() - 3600000}`,
            operatorName: 'Commandant R. K. Sharma',
            operatorEmail: 'operations@mrcc-mumbai.gov.in',
            operatorOrg: 'Indian Coast Guard (MRCC Mumbai)',
            actionType: 'USER_LOGIN',
            targetIncidentOrSector: 'Mumbai High Offshore Terminal',
            details: 'Station authenticated for 24/7 autonomous SAR radar surveillance sweep.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            istTimestamp: new Date(Date.now() - 3600000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          },
          {
            id: `log-${Date.now() - 1800000}`,
            operatorName: 'Dr. P. S. V. Rao',
            operatorEmail: 'ocean-hazards@incois.gov.in',
            operatorOrg: 'INCOIS National Marine Hazards Lab',
            actionType: 'ALERT_VIEWED',
            targetIncidentOrSector: 'Gulf of Kutch / Jamnagar Fairway',
            details: 'Reviewed ISRO EOS-06 Bragg scattering dampening anomaly and forward drift vector.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            istTimestamp: new Date(Date.now() - 1800000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          },
        ];
        this.saveAuditLogs();
      }
    } catch {
      this.currentUser = PRESET_OPERATORS[0];
    }

    return this.currentUser;
  }

  public static getCurrentUser(): OperatorProfile {
    if (!this.currentUser) {
      return this.initialize();
    }
    return this.currentUser;
  }

  public static getSavedProfiles(): OperatorProfile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_LOGINS);
      if (saved) {
        const customProfiles: OperatorProfile[] = JSON.parse(saved);
        const combined = [...PRESET_OPERATORS];
        customProfiles.forEach((cp) => {
          if (!combined.some((p) => p.id === cp.id || p.email.toLowerCase() === cp.email.toLowerCase())) {
            combined.push(cp);
          }
        });
        return combined;
      }
    } catch {}
    return PRESET_OPERATORS;
  }

  public static loginUser(profile: OperatorProfile): OperatorProfile {
    const updated: OperatorProfile = {
      ...profile,
      loginTimestamp: new Date().toISOString(),
    };
    this.currentUser = updated;
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updated));
      const saved = this.getSavedProfiles();
      const exists = saved.some((p) => p.email.toLowerCase() === updated.email.toLowerCase());
      if (!exists) {
        const customSaved = [updated, ...saved];
        localStorage.setItem(STORAGE_KEY_SAVED_LOGINS, JSON.stringify(customSaved));
      }
    } catch {}

    this.recordAuditLog({
      actionType: 'USER_LOGIN',
      targetIncidentOrSector: 'Maritime Command Center',
      details: `Operator ${updated.name} logged into ${updated.organization} (${updated.stationId}).`,
      operatorName: updated.name,
      operatorEmail: updated.email,
      operatorOrg: updated.organization,
    });

    return updated;
  }

  public static recordAuditLog(entry: {
    actionType: AuditActionLog['actionType'];
    targetIncidentOrSector: string;
    details: string;
    recipientInfo?: string;
    carrierReceiptId?: string;
    satellitePowerTelemetry?: AuditActionLog['satellitePowerTelemetry'];
    operatorName?: string;
    operatorEmail?: string;
    operatorOrg?: string;
  }): AuditActionLog {
    const user = this.currentUser || PRESET_OPERATORS[0];
    const now = new Date();
    const log: AuditActionLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      operatorName: entry.operatorName || user.name,
      operatorEmail: entry.operatorEmail || user.email,
      operatorOrg: entry.operatorOrg || user.organization,
      actionType: entry.actionType,
      targetIncidentOrSector: entry.targetIncidentOrSector,
      details: entry.details,
      recipientInfo: entry.recipientInfo,
      carrierReceiptId: entry.carrierReceiptId,
      satellitePowerTelemetry: entry.satellitePowerTelemetry,
      timestamp: now.toISOString(),
      istTimestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    this.auditLogs = [log, ...this.auditLogs];
    this.saveAuditLogs();

    // Fire & forget sync with backend
    fetch('/api/audit-history/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch(() => {});

    return log;
  }

  public static getAuditLogs(): AuditActionLog[] {
    return this.auditLogs;
  }

  public static clearAuditLogs(): void {
    this.auditLogs = [];
    try {
      localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
    } catch {}
  }

  private static saveAuditLogs(): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(this.auditLogs.slice(0, 100)));
    } catch {}
  }

  // Calculate nearest ships and coastal stations based on geographic position
  public static calculateNearestAssets(lat: number, lng: number): {
    ships: NearestShip[];
    stations: NearestCoastalStation[];
  } {
    const isIndia = (lat >= 5 && lat <= 26 && lng >= 65 && lng <= 95);

    let baseShips: NearestShip[] = [];
    let baseStations: NearestCoastalStation[] = [];

    if (isIndia) {
      baseShips = [
        {
          mmsi: '419001420',
          name: 'M/T BHARAT SAMUDRA',
          callSign: 'AWXY',
          flag: 'India (Shipping Corp of India)',
          type: 'VLCC Crude Tanker',
          distanceNm: 12.4,
          bearingDeg: 285,
          speedKnots: 11.8,
          courseDeg: 140,
          lat: lat + 0.12,
          lng: lng - 0.18,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'Standby 518 kHz',
        },
        {
          mmsi: '419990812',
          name: 'ICGS SAMUDRA PAVAK (CG-201)',
          callSign: '4ICG',
          flag: 'Indian Coast Guard Pollution Interceptor',
          type: 'ICG Fast Patrol Vessel',
          distanceNm: 18.2,
          bearingDeg: 45,
          speedKnots: 24.5,
          courseDeg: 220,
          lat: lat + 0.22,
          lng: lng + 0.15,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'Encrypted GMDSS Net Active',
        },
        {
          mmsi: '636018991',
          name: 'M/V PACIFIC CORAL',
          callSign: 'D5XY',
          flag: 'Liberia',
          type: 'Bulk Carrier',
          distanceNm: 26.7,
          bearingDeg: 175,
          speedKnots: 13.2,
          courseDeg: 340,
          lat: lat - 0.38,
          lng: lng + 0.05,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'Inmarsat-C Ready',
        },
        {
          mmsi: '419112440',
          name: 'TUG SAGAR VIKRAM',
          callSign: 'VTSG',
          flag: 'India (Port Authority Salvage)',
          type: 'Offshore Tug',
          distanceNm: 8.5,
          bearingDeg: 320,
          speedKnots: 9.6,
          courseDeg: 115,
          lat: lat + 0.08,
          lng: lng - 0.10,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'VHF Ch 16 / DSC 70',
        },
      ];

      baseStations = [
        {
          stationId: 'MRCC-BOM-MAIN',
          name: 'MRCC Mumbai (Indian Coast Guard Regional HQ)',
          authority: 'Ministry of Defence / Indian Coast Guard',
          vhfChannel: 'VHF Ch 16 / DSC 70',
          navtexCode: 'B (Mumbai Radio 518 kHz)',
          distanceNm: 34.2,
          bearingDeg: 82,
          status: 'OPERATIONAL',
        },
        {
          stationId: 'INCOIS-HYD-EOC',
          name: 'INCOIS Marine Hazard Operations Centre',
          authority: 'Ministry of Earth Sciences (MoES)',
          vhfChannel: 'Satellite Telemetry Gateway',
          navtexCode: 'INCOIS-SAT-POL',
          distanceNm: 240.0,
          bearingDeg: 110,
          status: 'RECEIVING',
        },
        {
          stationId: 'JNPT-VTS-RADAR',
          name: 'Jawaharlal Nehru Port Trust (JNPT) VTS Radar',
          authority: 'Directorate General of Lighthouses & Lightships',
          vhfChannel: 'VHF Ch 12 / 14 / 16',
          navtexCode: 'JNPT-VTS-01',
          distanceNm: 28.5,
          bearingDeg: 95,
          status: 'OPERATIONAL',
        },
      ];
    } else {
      // Global / Strategic International Chokepoint
      baseShips = [
        {
          mmsi: '538006789',
          name: 'M/T MAJESTIC VOYAGER',
          callSign: 'V7AB2',
          flag: 'Marshall Islands',
          type: 'VLCC Crude Tanker',
          distanceNm: 15.1,
          bearingDeg: 310,
          speedKnots: 12.4,
          courseDeg: 125,
          lat: lat + 0.18,
          lng: lng - 0.22,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'Inmarsat-C Active',
        },
        {
          mmsi: '256449000',
          name: 'M/V NORDIC STREAM',
          callSign: '9HA42',
          flag: 'Malta',
          type: 'Container Vessel',
          distanceNm: 22.0,
          bearingDeg: 140,
          speedKnots: 18.5,
          courseDeg: 315,
          lat: lat - 0.25,
          lng: lng + 0.20,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'Standby 518 kHz',
        },
        {
          mmsi: '352994000',
          name: 'M/T ARABIAN TITAN',
          callSign: '3E211',
          flag: 'Panama',
          type: 'Suezmax Tanker',
          distanceNm: 31.4,
          bearingDeg: 220,
          speedKnots: 11.0,
          courseDeg: 40,
          lat: lat - 0.35,
          lng: lng - 0.28,
          bridgeReceiverStatus: 'ONLINE',
          lastNavtexRx: 'SafetyNET High Priority',
        },
      ];

      baseStations = [
        {
          stationId: 'IMO-GMDSS-AREA-VIII',
          name: 'IMO NAVAREA VIII Coordinator (Naval Hydrographic Office)',
          authority: 'International Maritime Organization / IHO',
          vhfChannel: 'NAVAREA Broadcast 518 kHz',
          navtexCode: 'NAVAREA-VIII-PRIORITY',
          distanceNm: 45.0,
          bearingDeg: 45,
          status: 'OPERATIONAL',
        },
        {
          stationId: 'EMSA-CLEANSEANET',
          name: 'EMSA CleanSeaNet Satellite Ops Desk',
          authority: 'European Maritime Safety Agency',
          vhfChannel: 'Secure Copernicus Relay',
          navtexCode: 'EMSA-SAR-NET',
          distanceNm: 180.0,
          bearingDeg: 290,
          status: 'OPERATIONAL',
        },
      ];
    }

    return { ships: baseShips, stations: baseStations };
  }
}
