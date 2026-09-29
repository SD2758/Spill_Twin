import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Calendar,
  Clock,
  MapPin,
  Waves,
  Wind,
  Ship,
  Compass,
  Flame,
  AlertTriangle,
  ArrowRight,
  Search,
  Sliders,
  CheckCircle2,
  Sparkles,
  Satellite,
  Download,
  FileText,
  Layers,
  ChevronRight,
  Info,
  ShieldAlert,
  Droplets,
  ExternalLink,
  RefreshCw,
  Award,
  ShieldCheck,
  Check,
  Copy,
  Globe,
  Database
} from 'lucide-react';
import { HistoricalSpillData } from '../types';
import { HISTORICAL_SPILL_ARCHIVE } from '../data/historicalSpillArchive';

interface HistoricalTimeMachineProps {
  reducedMotion: boolean;
  onLoadIntoWorkbench?: (historicalData: HistoricalSpillData) => void;
  onNavigateToSatelliteAi?: (lat: number, lng: number, zoom: number, name: string) => void;
}

export const HistoricalTimeMachine: React.FC<HistoricalTimeMachineProps> = ({
  reducedMotion,
  onLoadIntoWorkbench,
  onNavigateToSatelliteAi,
}) => {
  // State for search and active record
  const [searchDate, setSearchDate] = useState<string>('2010-08-07');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeSpill, setActiveSpill] = useState<HistoricalSpillData>(HISTORICAL_SPILL_ARCHIVE[0]);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'ALL' | 'INDIA' | 'GLOBAL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeVolumeUnit, setActiveVolumeUnit] = useState<'tonnes' | 'barrels' | 'm3' | 'gallons'>('tonnes');
  const [matchNotice, setMatchNotice] = useState<string | null>('Verified Historical Event (Indian Coast Guard & DG Shipping Archived Data)');
  const [showFullNarrative, setShowFullNarrative] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [copiedGranule, setCopiedGranule] = useState<boolean>(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapLayersRef = useRef<L.LayerGroup>(L.layerGroup());

  // Filtered preset spills
  const filteredArchive = HISTORICAL_SPILL_ARCHIVE.filter((spill) => {
    if (selectedRegionFilter === 'ALL') return true;
    if (selectedRegionFilter === 'INDIA') {
      return (
        spill.countryOrSea.toLowerCase().includes('india') ||
        spill.countryOrSea.toLowerCase().includes('arabian') ||
        spill.countryOrSea.toLowerCase().includes('bengal') ||
        spill.countryOrSea.toLowerCase().includes('sundarbans')
      );
    }
    if (selectedRegionFilter === 'GLOBAL') {
      return !(
        spill.countryOrSea.toLowerCase().includes('india') &&
        !spill.countryOrSea.toLowerCase().includes('gulf')
      );
    }
    return true;
  });

  // Function to search/reconstruct spill data
  const handlePerformLookup = async (dateStr?: string, keywordStr?: string) => {
    const targetDate = dateStr !== undefined ? dateStr : searchDate;
    const targetKeyword = keywordStr !== undefined ? keywordStr : searchKeyword;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sat/historical-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryDate: targetDate,
          incidentQuery: targetKeyword,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setActiveSpill(resData.data);
        if (resData.matchType === 'VERIFIED_HISTORICAL_ARCHIVE') {
          setMatchNotice('Verified Historical Archive (Official Coast Guard & Space Agency Telemetry)');
        } else if (resData.matchType === 'AI_RECONSTRUCTED_HISTORICAL_EVENT') {
          setMatchNotice('AI & Hydrodynamic Reconstructed Scenario (Historical Date Correlated)');
        } else {
          setMatchNotice('Historical Metocean Reconstruction');
        }
      }
    } catch (err) {
      console.warn('Historical lookup error, falling back to static archive:', err);
      const match = HISTORICAL_SPILL_ARCHIVE.find(
        (s) => s.date.includes(targetDate) || s.incidentName.toLowerCase().includes(targetKeyword.toLowerCase())
      );
      if (match) {
        setActiveSpill(match);
        setMatchNotice('Verified Historical Archive');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Preset button handler
  const handleSelectPreset = (spill: HistoricalSpillData) => {
    setSearchDate(spill.date);
    setSearchKeyword(spill.incidentName);
    setActiveSpill(spill);
    setMatchNotice('Verified Historical Archive');
  };

  // Initialize and update Leaflet map when activeSpill changes
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeSpill.centroid.lat, activeSpill.centroid.lng],
        zoom: activeSpill.centroid.zoom || 11,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark Satellite / Carto base tiles
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
      }).addTo(map);

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapLayersRef.current.addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    mapLayersRef.current.clearLayers();

    // Pan map to new centroid
    map.setView([activeSpill.centroid.lat, activeSpill.centroid.lng], activeSpill.centroid.zoom || 11, {
      animate: !reducedMotion,
    });

    // 1. Draw Slick Polygon
    if (activeSpill.slickPolygon && activeSpill.slickPolygon.coordinates) {
      const latLngs = activeSpill.slickPolygon.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
      
      const polygon = L.polygon(latLngs, {
        color: '#06b6d4',
        weight: 2,
        fillColor: '#0f172a',
        fillOpacity: 0.75,
        dashArray: '4, 4',
      });

      polygon.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
          <strong style="color: #0284c7; font-size: 13px;">${activeSpill.incidentName}</strong><br/>
          <span style="font-size: 11px; color: #475569;">Radar Low-Backscatter Damping Slick Footprint</span><br/>
          <div style="margin-top: 4px; font-size: 11px; font-weight: bold; color: #e11d48;">
            Area: ${activeSpill.spillVolume.areaCoveredKm2} km² (${activeSpill.spillVolume.amountTonnes} Tonnes)
          </div>
        </div>
      `);
      mapLayersRef.current.addLayer(polygon);
    }

    // 2. Draw Center Epicenter Marker
    const epicenterIcon = L.divIcon({
      className: 'custom-epicenter-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(225, 29, 72, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: #e11d48; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(225, 29, 72, 0.8);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const centerMarker = L.marker([activeSpill.centroid.lat, activeSpill.centroid.lng], {
      icon: epicenterIcon,
    });
    centerMarker.bindPopup(`
      <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
        <strong style="color: #e11d48; font-size: 13px;">Spill Epicenter / Origin</strong><br/>
        <span style="font-size: 11px;">${activeSpill.formattedDate}</span><br/>
        <span style="font-size: 11px; color: #64748b;">Lat: ${activeSpill.centroid.lat.toFixed(4)}°, Lng: ${activeSpill.centroid.lng.toFixed(4)}°</span>
      </div>
    `);
    mapLayersRef.current.addLayer(centerMarker);

    // 3. Draw Vessels
    if (activeSpill.vessels && activeSpill.vessels.length > 0) {
      activeSpill.vessels.forEach((vessel, index) => {
        // Approximate position offset if not specified
        const angle = ((index * 90 + 30) * Math.PI) / 180;
        const distDeg = (vessel.distanceFromSpillKm || 0.5) / 111.0;
        const vLat = activeSpill.centroid.lat + Math.sin(angle) * distDeg;
        const vLng = activeSpill.centroid.lng + Math.cos(angle) * distDeg;

        const isCulprit = vessel.role.includes('Culprit');
        const isCollision = vessel.role.includes('Collision');
        const color = isCulprit ? '#ef4444' : isCollision ? '#f97316' : '#38bdf8';

        const shipIcon = L.divIcon({
          className: 'custom-ship-marker',
          html: `
            <div style="background-color: #0f172a; border: 1.5px solid ${color}; color: ${color}; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px;">
              <span>🚢 ${vessel.name}</span>
            </div>
          `,
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });

        const vMarker = L.marker([vLat, vLng], { icon: shipIcon });
        vMarker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; padding: 4px; min-width: 180px;">
            <strong style="color: ${color}; font-size: 12px;">${vessel.name}</strong> (${vessel.flag})<br/>
            <span style="font-size: 11px; font-weight: 600;">${vessel.role}</span><br/>
            <span style="font-size: 10px; color: #64748b;">Type: ${vessel.type} | IMO: ${vessel.imo || 'N/A'}</span><br/>
            <span style="font-size: 10px; color: #64748b;">Speed: ${vessel.speedKnots} kn | Heading: ${vessel.headingDeg}°</span><br/>
            <div style="margin-top: 4px; font-size: 10px; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 2px;">
              ${vessel.notes}
            </div>
          </div>
        `);
        mapLayersRef.current.addLayer(vMarker);
      });
    }

    // 4. Draw Drift Trajectory Line
    if (activeSpill.driftTrajectory && activeSpill.driftTrajectory.length > 1) {
      const trajCoords = activeSpill.driftTrajectory.map((t) => [t.lat, t.lng] as [number, number]);
      const driftLine = L.polyline(trajCoords, {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 6',
      });
      mapLayersRef.current.addLayer(driftLine);

      // Trajectory point markers
      activeSpill.driftTrajectory.forEach((t) => {
        const tIcon = L.divIcon({
          className: 'traj-step-icon',
          html: `
            <div style="background-color: ${t.shorelineHit ? '#ef4444' : '#f59e0b'}; color: #ffffff; font-size: 9px; font-weight: bold; width: 22px; height: 22px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.6);">
              ${t.stepHours}h
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([t.lat, t.lng], { icon: tIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
            <strong>Drift Forecast: +${t.stepHours} Hours</strong><br/>
            <span style="font-size: 11px;">Spread Area: ${t.slickAreaKm2} km²</span><br/>
            ${t.shorelineHit ? '<span style="color: #e11d48; font-weight: bold; font-size: 11px;">⚠️ Coastal Landfall / Mangrove Deposition</span>' : '<span style="color: #0284c7; font-size: 11px;">Open Water Advection</span>'}
          </div>
        `);
        mapLayersRef.current.addLayer(marker);
      });
    }
  }, [activeSpill, reducedMotion]);

  const copyDossier = () => {
    navigator.clipboard.writeText(activeSpill.fullNarrativeMarkdown || activeSpill.summary);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8" id="historical-time-machine-view">
      {/* 1. Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/50 border border-cyan-500/30 p-6 md:p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Temporal Satellite Oil Spill Ingestion & Historical Time Machine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Historical Incident Reconstructor
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              Test and validate SpillTwin against real documented historical maritime disasters. Select any historical date (e.g. <strong>Aug 7, 2010 Mumbai Collision</strong>, <strong>Apr 20, 2010 Deepwater Horizon</strong>) or enter any custom date to automatically compute oil spill volume (<em>"Kitna Hua"</em>), water current vectors, wave directions, AIS vessel culpability, and multi-sensor satellite passes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onLoadIntoWorkbench && (
              <button
                id="load-into-workbench-btn"
                onClick={() => onLoadIntoWorkbench(activeSpill)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Sliders className="w-4 h-4" />
                <span>Simulate in SAR Workbench</span>
              </button>
            )}

            {onNavigateToSatelliteAi && (
              <button
                id="view-in-sat-ai-btn"
                onClick={() =>
                  onNavigateToSatelliteAi(
                    activeSpill.centroid.lat,
                    activeSpill.centroid.lng,
                    activeSpill.centroid.zoom,
                    activeSpill.locationName
                  )
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all"
              >
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span>Live Satellite AI View</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search & Historical Bookmarks Bar */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <label htmlFor="historical-date-input" className="block text-xs font-semibold text-slate-400 mb-1">
                Target Incident Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="historical-date-input"
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex-1 relative">
              <label htmlFor="historical-keyword-input" className="block text-xs font-semibold text-slate-400 mb-1">
                Or Search by Keyword / Location / Ship
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="historical-keyword-input"
                  type="text"
                  placeholder="e.g. Mumbai MSC Chitra, Wakashio, Deepwater Horizon, Alaska..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePerformLookup()}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              id="reconstruct-spill-btn"
              onClick={() => handlePerformLookup()}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reconstructing Ocean Telemetry...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Fetch & Detect Incident</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets Carousel with Region Filters */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Benchmark Historical Disasters for Verification:</span>
            </div>

            {/* Region Filter Buttons */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedRegionFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedRegionFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Archive ({HISTORICAL_SPILL_ARCHIVE.length})
              </button>
              <button
                onClick={() => setSelectedRegionFilter('INDIA')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  selectedRegionFilter === 'INDIA'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇮🇳 Indian EEZ</span>
              </button>
              <button
                onClick={() => setSelectedRegionFilter('GLOBAL')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  selectedRegionFilter === 'GLOBAL'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌍 Global</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredArchive.map((spill) => {
              const isSelected = activeSpill.id === spill.id;
              const isIndia = spill.countryOrSea.toLowerCase().includes('india') || spill.countryOrSea.toLowerCase().includes('sundarbans');
              return (
                <button
                  key={spill.id}
                  id={`preset-${spill.id}`}
                  onClick={() => handleSelectPreset(spill)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-white ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-0.5">
                    <span>{spill.date}</span>
                    {isSelected ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    ) : isIndia ? (
                      <span className="text-[10px]">🇮🇳</span>
                    ) : (
                      <span className="text-[10px]">🌍</span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-white truncate">{spill.incidentName}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="truncate">{spill.locationName.split(',')[0]}</span>
                    <span className="font-mono text-rose-400 font-semibold">{spill.spillVolume.amountTonnes.toLocaleString()} T</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spill Metrics & Telemetry (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Incident Title Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
                  Historical Detection Confirmed
                </span>
                <span className="text-xs text-slate-400 font-mono">{activeSpill.formattedDate}</span>
              </div>
              {matchNotice && (
                <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{matchNotice}</span>
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{activeSpill.incidentName}</h2>
              <div className="flex items-center gap-2 text-sm text-cyan-300 font-medium">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{activeSpill.locationName}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 text-xs font-mono">
                  [{activeSpill.centroid.lat.toFixed(4)}°N, {activeSpill.centroid.lng.toFixed(4)}°E]
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">{activeSpill.summary}</p>

            {/* Official Provenance & Report Identification Banner */}
            {activeSpill.officialSource && (
              <div className="rounded-lg bg-cyan-950/30 border border-cyan-500/30 p-3.5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">Official Investigating Authority:</span>
                    <span className="text-cyan-300 font-medium">{activeSpill.officialSource}</span>
                  </div>
                  {activeSpill.officialReportId && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/40 font-mono text-[11px] text-cyan-300 font-bold">
                      Doc Ref: {activeSpill.officialReportId}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[11px] border-t border-cyan-500/20 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Status: <strong className="text-slate-200">{activeSpill.dataProvenance?.investigationStatus || 'Official Record'}</strong></span>
                  </div>

                  {activeSpill.dataProvenance?.satelliteSensorGranule && (
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-cyan-400" />
                      <span className="font-mono text-slate-300 truncate max-w-[200px] sm:max-w-[320px]">
                        Granule: {activeSpill.dataProvenance.satelliteSensorGranule}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeSpill.dataProvenance?.satelliteSensorGranule || '');
                          setCopiedGranule(true);
                          setTimeout(() => setCopiedGranule(false), 2000);
                        }}
                        className="p-1 hover:text-cyan-300 text-slate-400"
                        title="Copy Satellite Granule ID"
                      >
                        {copiedGranule ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  {activeSpill.officialSourceUrl && (
                    <a
                      href={activeSpill.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                    >
                      <span>Official Source Citation</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* "Kitna Hua" - Spill Volume & Mass Chemistry Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base text-white">Spill Magnitude & Chemistry ("Kitna Hua")</h3>
              </div>

              {/* Unit Toggle */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-medium">
                {(['tonnes', 'barrels', 'm3', 'gallons'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setActiveVolumeUnit(unit)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                      activeVolumeUnit === unit
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium block">Total Released</span>
                <span className="text-xl font-extrabold text-rose-400 font-mono">
                  {activeVolumeUnit === 'tonnes' && `${activeSpill.spillVolume.amountTonnes.toLocaleString()} Tonnes`}
                  {activeVolumeUnit === 'barrels' && `${activeSpill.spillVolume.amountBarrels.toLocaleString()} bbl`}
                  {activeVolumeUnit === 'm3' && `${activeSpill.spillVolume.amountM3.toLocaleString()} m³`}
                  {activeVolumeUnit === 'gallons' && `${activeSpill.spillVolume.amountGallons.toLocaleString()} Gal`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Calculated Net Mass</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium block">Surface Area</span>
                <span className="text-xl font-extrabold text-cyan-400 font-mono">
                  {activeSpill.spillVolume.areaCoveredKm2.toLocaleString()} km²
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Radar Bragg Attenuation</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium block">API Gravity</span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">
                  {activeSpill.spillVolume.apiGravity}° API
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {activeSpill.spillVolume.apiGravity < 20 ? 'Heavy Asphaltic' : 'Light Volatile'}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium block">Mangrove / Reef Risk</span>
                <span className={`text-xl font-extrabold font-mono ${
                  activeSpill.ecologicalImpact.mangroveRisk === 'Critical' || activeSpill.ecologicalImpact.coralReefRisk === 'Critical'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}>
                  {activeSpill.ecologicalImpact.mangroveRisk === 'Critical' ? 'CRITICAL' : 'ELEVATED'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Vulnerability Score</span>
              </div>
            </div>

            {/* Hydrocarbon Composition & Cause */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-300 min-w-28">Hydrocarbon Type:</span>
                <span className="text-cyan-300 font-mono">{activeSpill.spillVolume.oilType}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-300 min-w-28">Incident Root Cause:</span>
                <span className="text-slate-300">{activeSpill.spillVolume.spillCause}</span>
              </div>
            </div>
          </div>

          {/* Metocean & Hydrodynamic Forcing Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-base text-white">Oceanographic & Metocean Telemetry</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Water Current Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5" />
                    Water Current Vector
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {activeSpill.metocean.waterCurrentDirectionDeg}° TN
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-white font-mono">
                    {activeSpill.metocean.waterCurrentSpeedKnots} kn
                  </span>
                  <span className="text-xs text-slate-400">({activeSpill.metocean.waterCurrentSpeedMps} m/s)</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeSpill.metocean.waterCurrentDescription}
                </p>
              </div>

              {/* Surface Wind & Wave Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    Surface Wind & Waves
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    {activeSpill.metocean.windDirectionDeg}° TN
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {activeSpill.metocean.windSpeedKnots} kn
                    </span>
                    <span className="text-xs text-slate-400">({activeSpill.metocean.windSpeedMps} m/s)</span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan-300 font-mono">{activeSpill.metocean.waveHeightMeters}m</span>
                    <span className="text-[10px] text-slate-400 block">Wave Height</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeSpill.metocean.seaStateDescription}
                </p>
              </div>
            </div>

            {/* Satellite Sensor Details */}
            <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white">Historical Spaceborne Sensor:</span>
                <span className="text-cyan-300 font-mono">{activeSpill.satelliteSensor.sensorName}</span>
              </div>
              <div className="text-slate-400 font-mono">
                {activeSpill.satelliteSensor.band} | {activeSpill.satelliteSensor.polarization} | {activeSpill.satelliteSensor.resolutionMeters}m Res
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map & Vessel Fleet (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Historical Interactive Map Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Satellite Radar & Drift GIS View</h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                C-Band Attenuation Overlay
              </span>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-80 sm:h-96 rounded-lg overflow-hidden border border-slate-800 shadow-inner relative z-0"
            />

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-900 border border-cyan-400" />
                <span>Radar Slick Polygon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Spill Epicenter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400" />
                <span>48h Drift Path</span>
              </div>
            </div>
          </div>

          {/* Culprit & Involved Vessels Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">AIS Vessels & Culprit Fleet Registry</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {activeSpill.vessels.length} Ships Tracked
              </span>
            </div>

            <div className="space-y-2.5">
              {activeSpill.vessels.map((vessel, idx) => {
                const isCulprit = vessel.role.includes('Culprit');
                const isCollision = vessel.role.includes('Collision');
                const badgeColor = isCulprit
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : isCollision
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{vessel.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({vessel.flag})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                        {vessel.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Type</span>
                        <span className="text-slate-300 truncate block">{vessel.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Speed / Heading</span>
                        <span className="text-slate-300">{vessel.speedKnots} kn @ {vessel.headingDeg}°</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">IMO Number</span>
                        <span className="text-slate-300">{vessel.imo || 'N/A'}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">
                      {vessel.notes}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Ecological Impact & Full Forensic Narrative Section */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base text-white">Ecological Vulnerability & Forensic Dossier</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              {copiedReport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Copied to Clipboard!' : 'Export Dossier'}</span>
            </button>

            <button
              onClick={() => setShowFullNarrative(!showFullNarrative)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1"
            >
              {showFullNarrative ? 'Collapse Report' : 'Read Full Investigation'}
            </button>
          </div>
        </div>

        {/* Affected Ports & Habitats */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-300">Harbors & Navigational Channels Closed:</span>
            {activeSpill.ecologicalImpact.portsAffected.map((port, pIdx) => (
              <span key={pIdx} className="px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/30 font-medium">
                ⛔ {port}
              </span>
            ))}
          </div>

          <p className="text-slate-300 text-sm leading-relaxed pt-1">
            {activeSpill.ecologicalImpact.summary}
          </p>

          {/* Verified Official Citations list if available */}
          {activeSpill.dataProvenance?.officialCitations && activeSpill.dataProvenance.officialCitations.length > 0 && (
            <div className="border-t border-slate-800/80 pt-3 space-y-1.5">
              <span className="font-semibold text-cyan-300 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Verified Legal & Environmental Citations:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                {activeSpill.dataProvenance.officialCitations.map((citation, cIdx) => (
                  <li key={cIdx} className="text-slate-300">
                    {citation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Full Markdown Narrative Preview */}
        {showFullNarrative && (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {activeSpill.fullNarrativeMarkdown}
          </div>
        )}
      </div>
    </div>
  );
};
