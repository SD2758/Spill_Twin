import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Satellite,
  Compass,
  Ship,
  Waves,
  Wind,
  Thermometer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Phone,
  Mail,
  Send,
  Sparkles,
} from 'lucide-react';
import { SurveillanceSector } from '../types';

interface LiveMarineFeedProps {
  onSelectSector?: (sector: SurveillanceSector) => void;
  onTriggerSweepForSector?: (sector: SurveillanceSector) => void;
  reducedMotion?: boolean;
}

export const LIVE_SECTORS_DATA: SurveillanceSector[] = [
  {
    id: 'sec-mumbai-high',
    name: 'Mumbai High Offshore Oilfields',
    code: 'ICG-WZ-MUM',
    region: 'INDIA',
    subZone: 'Arabian Sea Continental Shelf',
    stateOrCountry: 'Maharashtra, India',
    coordinates: { lat: 18.95, lng: 72.82, zoom: 10 },
    bounds: { north: 19.3, south: 18.6, east: 73.2, west: 72.4 },
    marineTrafficDensity: 'CRITICAL',
    primaryRefineriesAndPorts: ['JNPT Port', 'Mumbai Port Trust', 'BPCL/HPCL Mahul Refineries', 'ONGC Platforms'],
    ecologicalSensitivity: 'HIGH (Fisheries/Coastal Eco)',
    satellitesMonitoring: ['Sentinel-1A (SAR C-Band)', 'ISRO EOS-06 (OceanSat-3)', 'RISAT-2B (X-SAR)'],
    incoisStationId: 'INCOIS-WR-MB-01',
    currentRiskLevel: 'SPILL_DETECTED',
    defaultMetocean: {
      windSpeedMps: 7.2,
      windDirectionDeg: 285,
      currentSpeedMps: 0.65,
      currentDirectionDeg: 135,
      waveHeightMeters: 1.6,
      seaTempC: 28.4,
      currentName: 'West India Coastal Current (WICC)',
    },
  },
  {
    id: 'sec-gulf-of-kutch',
    name: 'Gulf of Kutch / Jamnagar Refinery Fairway',
    code: 'ICG-NWZ-GOK',
    region: 'INDIA',
    subZone: 'Vadinar & Sikka Marine Terminals',
    stateOrCountry: 'Gujarat, India',
    coordinates: { lat: 22.50, lng: 69.30, zoom: 10 },
    bounds: { north: 22.9, south: 22.1, east: 69.8, west: 68.8 },
    marineTrafficDensity: 'CRITICAL',
    primaryRefineriesAndPorts: ['Jamnagar Reliance SPM', 'Nayara Energy Refinery', 'Deendayal Kandla Port', 'Mundra Adani Port'],
    ecologicalSensitivity: 'CRITICAL (Mangroves/Coral/Sanctuary)',
    satellitesMonitoring: ['Sentinel-1A', 'Sentinel-1B', 'ISRO EOS-04', 'Sentinel-2 MSI'],
    incoisStationId: 'INCOIS-NW-GK-04',
    currentRiskLevel: 'ELEVATED',
    defaultMetocean: {
      windSpeedMps: 8.8,
      windDirectionDeg: 310,
      currentSpeedMps: 1.45,
      currentDirectionDeg: 95,
      waveHeightMeters: 1.9,
      seaTempC: 27.2,
      currentName: 'Gulf of Kutch Tidal Bore Current',
    },
  },
  {
    id: 'sec-ennore-chennai',
    name: 'Chennai Ennore / Kamarajar Fairway',
    code: 'ICG-EZ-CHN',
    region: 'INDIA',
    subZone: 'Coromandel Coast Tanker Transit',
    stateOrCountry: 'Tamil Nadu, India',
    coordinates: { lat: 13.25, lng: 80.35, zoom: 10 },
    bounds: { north: 13.6, south: 12.9, east: 80.7, west: 80.0 },
    marineTrafficDensity: 'VERY_HIGH',
    primaryRefineriesAndPorts: ['CPCL Manali Refinery', 'Kamarajar Port Ennore', 'Chennai Port Trust', 'Kattupalli Port'],
    ecologicalSensitivity: 'HIGH (Fisheries/Coastal Eco)',
    satellitesMonitoring: ['Sentinel-1A', 'ISRO Oceansat-3', 'RADARSAT-2'],
    incoisStationId: 'INCOIS-EC-CH-02',
    currentRiskLevel: 'NORMAL',
    defaultMetocean: {
      windSpeedMps: 5.4,
      windDirectionDeg: 120,
      currentSpeedMps: 0.48,
      currentDirectionDeg: 25,
      waveHeightMeters: 1.2,
      seaTempC: 29.1,
      currentName: 'East India Coastal Current (EICC)',
    },
  },
  {
    id: 'sec-paradip-bengal',
    name: 'Paradip Port / Bay of Bengal Basin',
    code: 'ICG-NEZ-PDP',
    region: 'INDIA',
    subZone: 'Mahanadi Estuary Offshore Basin',
    stateOrCountry: 'Odisha, India',
    coordinates: { lat: 20.25, lng: 86.68, zoom: 10 },
    bounds: { north: 20.6, south: 19.9, east: 87.2, west: 86.2 },
    marineTrafficDensity: 'HIGH',
    primaryRefineriesAndPorts: ['IOCL Paradip Refinery SPM', 'Paradip Port Trust', 'Dhamra LNG Terminal'],
    ecologicalSensitivity: 'CRITICAL (Mangroves/Coral/Sanctuary)',
    satellitesMonitoring: ['Sentinel-1A', 'EOS-06', 'Sentinel-2B'],
    incoisStationId: 'INCOIS-NE-PD-05',
    currentRiskLevel: 'MODERATE',
    defaultMetocean: {
      windSpeedMps: 6.9,
      windDirectionDeg: 180,
      currentSpeedMps: 0.55,
      currentDirectionDeg: 45,
      waveHeightMeters: 1.5,
      seaTempC: 28.9,
      currentName: 'Bay of Bengal Cyclonic Gyre Drift',
    },
  },
  {
    id: 'sec-great-nicobar',
    name: 'Great Nicobar / 6-Degree Channel',
    code: 'ICG-A&N-NIC',
    region: 'INDIA',
    subZone: 'Malacca Strait Western Approach',
    stateOrCountry: 'Andaman & Nicobar Islands, India',
    coordinates: { lat: 6.80, lng: 93.80, zoom: 9 },
    bounds: { north: 7.4, south: 6.2, east: 94.6, west: 93.0 },
    marineTrafficDensity: 'CRITICAL',
    primaryRefineriesAndPorts: ['Port Blair Coastal Base', 'Galathea Bay Transshipment Port', 'Indira Point Watch'],
    ecologicalSensitivity: 'CRITICAL (Mangroves/Coral/Sanctuary)',
    satellitesMonitoring: ['Sentinel-1A', 'Sentinel-1B', 'ISRO EOS-06', 'TerraSAR-X'],
    incoisStationId: 'INCOIS-AN-GN-09',
    currentRiskLevel: 'ELEVATED',
    defaultMetocean: {
      windSpeedMps: 7.8,
      windDirectionDeg: 240,
      currentSpeedMps: 0.95,
      currentDirectionDeg: 85,
      waveHeightMeters: 2.1,
      seaTempC: 29.8,
      currentName: 'Equatorial Jet & Andaman Monsoon Drift',
    },
  },
  {
    id: 'sec-strait-of-hormuz',
    name: 'Strait of Hormuz (Persian Gulf Chokepoint)',
    code: 'IMO-GLO-HRZ',
    region: 'GLOBAL',
    subZone: 'Oman-Iran Tanker Separation Scheme',
    stateOrCountry: 'Oman / Iran / UAE',
    coordinates: { lat: 26.56, lng: 56.25, zoom: 10 },
    bounds: { north: 27.1, south: 26.0, east: 56.8, west: 55.6 },
    marineTrafficDensity: 'CRITICAL',
    primaryRefineriesAndPorts: ['Fujairah Bunkering Hub', 'Ras Tanura Terminal', 'Jebel Ali Port', 'Bandar Abbas'],
    ecologicalSensitivity: 'CRITICAL (Mangroves/Coral/Sanctuary)',
    satellitesMonitoring: ['Copernicus Sentinel-1', 'COSMO-SkyMed', 'TerraSAR-X'],
    currentRiskLevel: 'SPILL_DETECTED',
    defaultMetocean: {
      windSpeedMps: 8.5,
      windDirectionDeg: 330,
      currentSpeedMps: 0.85,
      currentDirectionDeg: 120,
      waveHeightMeters: 1.4,
      seaTempC: 30.2,
      currentName: 'Persian Gulf Outflow Current',
    },
  },
  {
    id: 'sec-malacca-strait',
    name: 'Strait of Malacca (Singapore Approach)',
    code: 'IMO-GLO-MAL',
    region: 'GLOBAL',
    subZone: 'Phillips Channel & Main TSS',
    stateOrCountry: 'Singapore / Malaysia / Indonesia',
    coordinates: { lat: 1.43, lng: 103.12, zoom: 10 },
    bounds: { north: 1.8, south: 1.0, east: 103.7, west: 102.5 },
    marineTrafficDensity: 'CRITICAL',
    primaryRefineriesAndPorts: ['Jurong Island Petrochemical Hub', 'Port of Singapore (PSA)', 'Tanjung Pelepas Port'],
    ecologicalSensitivity: 'HIGH (Fisheries/Coastal Eco)',
    satellitesMonitoring: ['Sentinel-1A', 'Sentinel-1B', 'ALOS-2 PALSAR-2'],
    currentRiskLevel: 'ELEVATED',
    defaultMetocean: {
      windSpeedMps: 4.5,
      windDirectionDeg: 210,
      currentSpeedMps: 1.15,
      currentDirectionDeg: 305,
      waveHeightMeters: 0.9,
      seaTempC: 30.8,
      currentName: 'Malacca Strait Net North-West Drift',
    },
  },
  {
    id: 'sec-gulf-of-mexico',
    name: 'Gulf of Mexico (Mississippi Canyon / Macondo)',
    code: 'IMO-GLO-GOM',
    region: 'GLOBAL',
    subZone: 'Deepwater Horizon / LOOP Terminal Zone',
    stateOrCountry: 'United States (Louisiana Offshore)',
    coordinates: { lat: 28.73, lng: -88.38, zoom: 9 },
    bounds: { north: 29.4, south: 28.0, east: -87.5, west: -89.2 },
    marineTrafficDensity: 'VERY_HIGH',
    primaryRefineriesAndPorts: ['Louisiana Offshore Oil Port (LOOP)', 'Port of New Orleans', 'Port Fourchon'],
    ecologicalSensitivity: 'CRITICAL (Mangroves/Coral/Sanctuary)',
    satellitesMonitoring: ['Sentinel-1 SAR', 'RADARSAT Constellation (RCM)', 'Landsat-9'],
    currentRiskLevel: 'MODERATE',
    defaultMetocean: {
      windSpeedMps: 6.2,
      windDirectionDeg: 140,
      currentSpeedMps: 0.78,
      currentDirectionDeg: 75,
      waveHeightMeters: 1.3,
      seaTempC: 27.9,
      currentName: 'Gulf of Mexico Loop Current Eddy',
    },
  },
];

export const LiveGlobalMarineFeed: React.FC<LiveMarineFeedProps> = ({
  onSelectSector,
  onTriggerSweepForSector,
  reducedMotion = false,
}) => {
  const [regionTab, setRegionTab] = useState<'ALL' | 'INDIA' | 'GLOBAL'>('ALL');
  const [activeSector, setActiveSector] = useState<SurveillanceSector>(LIVE_SECTORS_DATA[0]);
  const [utcTime, setUtcTime] = useState<string>(new Date().toUTCString());
  const [istTime, setIstTime] = useState<string>(
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toUTCString());
      setIstTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredSectors = LIVE_SECTORS_DATA.filter((s) => {
    if (regionTab === 'INDIA') return s.region === 'INDIA';
    if (regionTab === 'GLOBAL') return s.region === 'GLOBAL';
    return true;
  });

  const getRiskBadge = (level: SurveillanceSector['currentRiskLevel']) => {
    switch (level) {
      case 'SPILL_DETECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Active Anomaly
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Elevated Watch
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Continuous Orbit Scan
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-cyan-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Header with live clock & orbital constellation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Globe className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
                  LIVE GLOBAL &amp; INDIA MARITIME SURVEILLANCE
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE ORBIT FEED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                24/7 Real-Time SAR Radar, Optical &amp; AIS telemetry across Indian EEZ and high-risk international tanker choke corridors
              </p>
            </div>
          </div>
        </div>

        {/* Clocks */}
        <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 block">INDIAN STANDARD TIME</span>
            <span className="text-cyan-300 font-bold">{istTime}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 block">COORDINATED UNIVERSAL</span>
            <span className="text-slate-300">{utcTime.split(' ').slice(4, 5)[0]} UTC</span>
          </div>
        </div>
      </div>

      {/* Region filter pills */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setRegionTab('ALL')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              regionTab === 'ALL' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Critical Fairways ({LIVE_SECTORS_DATA.length})
          </button>
          <button
            onClick={() => setRegionTab('INDIA')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              regionTab === 'INDIA' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇮🇳 India EEZ &amp; Coast Guard Sectors (5)
          </button>
          <button
            onClick={() => setRegionTab('GLOBAL')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              regionTab === 'GLOBAL' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌍 International Chokepoints (3)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Spacecraft: Sentinel-1A • ISRO EOS-06 • COSMO-SkyMed</span>
        </div>
      </div>

      {/* Grid of Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSectors.map((sector) => {
          const isSelected = activeSector.id === sector.id;
          return (
            <div
              key={sector.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3.5 ${
                isSelected
                  ? 'bg-slate-950 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {sector.code}
                      </span>
                      {sector.region === 'INDIA' ? (
                        <span className="text-[10px] font-bold text-amber-300">🇮🇳 INDIA</span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-300">🌍 GLOBAL</span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base mt-1">
                      {sector.name}
                    </h4>
                  </div>
                  {getRiskBadge(sector.currentRiskLevel)}
                </div>

                <p className="text-slate-400 text-xs">
                  {sector.subZone} • <span className="text-slate-300">{sector.stateOrCountry}</span>
                </p>

                {/* Metocean Buoy Sensor Readings */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-500 block">WIND</span>
                      <span>{sector.defaultMetocean.windSpeedMps} m/s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-500 block">CURRENT</span>
                      <span>{sector.defaultMetocean.currentSpeedMps} m/s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-500 block">SEA TEMP</span>
                      <span>{sector.defaultMetocean.seaTempC}°C</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Coordinates:</span>
                    <span className="font-mono text-slate-200">{sector.coordinates.lat.toFixed(2)}°N, {sector.coordinates.lng.toFixed(2)}°E</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ecological Zone:</span>
                    <span className="text-amber-400 text-[10px] font-semibold">{sector.ecologicalSensitivity.split(' ')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-xs">
                <button
                  onClick={() => {
                    setActiveSector(sector);
                    if (onSelectSector) onSelectSector(sector);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Sector</span>
                </button>

                <button
                  onClick={() => {
                    setActiveSector(sector);
                    if (onTriggerSweepForSector) onTriggerSweepForSector(sector);
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>Task SAR Pass</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
