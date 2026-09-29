import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Eye,
  EyeOff,
  Navigation,
  Ship,
  Info,
  Waves,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Flame,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { SarAnalysisResult, GeoCoordinate } from '../types';
import { D3SpillHeatmap, VisualizationMode, HeatmapColorScale } from './D3SpillHeatmap';

export interface SarMapProps {
  analysisResult: SarAnalysisResult | null;
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  activeTimestep?: number;
  visualizationMode?: VisualizationMode;
  onToggleVisualizationMode?: (mode: VisualizationMode) => void;
  colorScale?: HeatmapColorScale;
  onColorScaleChange?: (scale: HeatmapColorScale) => void;
  heatmapOpacity?: number;
  onHeatmapOpacityChange?: (opacity: number) => void;
}

export const SarMap: React.FC<SarMapProps> = ({
  analysisResult,
  selectedCandidateId,
  onSelectCandidate,
  activeTimestep = 0,
  visualizationMode: propVisualizationMode,
  onToggleVisualizationMode,
  colorScale: propColorScale,
  onColorScaleChange,
  heatmapOpacity: propHeatmapOpacity,
  onHeatmapOpacityChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);

  // Fallback internal states if not controlled by parent
  const [internalVisMode, setInternalVisMode] = useState<VisualizationMode>('heatmap');
  const [internalColorScale, setInternalColorScale] = useState<HeatmapColorScale>('bonn');
  const [internalOpacity, setInternalOpacity] = useState<number>(0.75);

  const visMode = propVisualizationMode !== undefined ? propVisualizationMode : internalVisMode;
  const activeColorScale = propColorScale !== undefined ? propColorScale : internalColorScale;
  const activeOpacity = propHeatmapOpacity !== undefined ? propHeatmapOpacity : internalOpacity;

  const handleSetVisMode = (mode: VisualizationMode) => {
    if (onToggleVisualizationMode) onToggleVisualizationMode(mode);
    else setInternalVisMode(mode);
  };

  const handleSetColorScale = (scale: HeatmapColorScale) => {
    if (onColorScaleChange) onColorScaleChange(scale);
    else setInternalColorScale(scale);
  };

  const handleSetOpacity = (op: number) => {
    if (onHeatmapOpacityChange) onHeatmapOpacityChange(op);
    else setInternalOpacity(op);
  };

  // Layer groups refs
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});
  const slickLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const vesselsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const driftLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const uncertaintyLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const particlesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const originMarkerGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Layer visibility state
  const [baseMapType, setBaseMapType] = useState<'satellite' | 'street' | 'dark'>('satellite');
  const [showSlick, setShowSlick] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showDrift, setShowDrift] = useState(true);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showDensityLegend, setShowDensityLegend] = useState(true);
  const [hoveredPointInfo, setHoveredPointInfo] = useState<{
    concentration: number;
    code: string;
    thickness: string;
  } | null>(null);

  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: 26.248,
    lng: 56.182,
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = analysisResult?.metrics.centre.lat || 26.248;
    const initialLng = analysisResult?.metrics.centre.lng || 56.182;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 11,
      zoomControl: false, // We render custom stylish zoom controls
      attributionControl: false,
    });

    // Basemaps
    const satelliteTileUrl =
      (import.meta as any).env?.VITE_SATELLITE_MAP_TILE_URL ||
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const satelliteLayer = L.tileLayer(satelliteTileUrl, {
      maxZoom: 18,
      attribution: 'Esri, Maxar, Earthstar Geographics',
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    });

    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© CartoDB',
    });

    baseLayersRef.current = {
      satellite: satelliteLayer,
      street: streetLayer,
      dark: darkLayer,
    };

    satelliteLayer.addTo(map);

    // Add Layer Groups to map
    slickLayerGroupRef.current.addTo(map);
    vesselsLayerGroupRef.current.addTo(map);
    driftLayerGroupRef.current.addTo(map);
    uncertaintyLayerGroupRef.current.addTo(map);
    particlesLayerGroupRef.current.addTo(map);
    originMarkerGroupRef.current.addTo(map);

    map.on('move', () => {
      const c = map.getCenter();
      setMapCenterCoords({ lat: Number(c.lat.toFixed(4)), lng: Number(c.lng.toFixed(4)) });
    });

    mapInstanceRef.current = map;
    setLeafletMap(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setLeafletMap(null);
    };
  }, []);

  // Switch base layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const layers = baseLayersRef.current;

    Object.values(layers).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    if (layers[baseMapType]) {
      layers[baseMapType].addTo(map);
    }
  }, [baseMapType]);

  // Toggle Layer Groups visibility
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (showSlick) map.addLayer(slickLayerGroupRef.current);
    else map.removeLayer(slickLayerGroupRef.current);

    if (showVessels) map.addLayer(vesselsLayerGroupRef.current);
    else map.removeLayer(vesselsLayerGroupRef.current);

    if (showDrift) map.addLayer(driftLayerGroupRef.current);
    else map.removeLayer(driftLayerGroupRef.current);

    if (showUncertainty) map.addLayer(uncertaintyLayerGroupRef.current);
    else map.removeLayer(uncertaintyLayerGroupRef.current);

    if (showParticles) map.addLayer(particlesLayerGroupRef.current);
    else map.removeLayer(particlesLayerGroupRef.current);
  }, [showSlick, showVessels, showDrift, showUncertainty, showParticles]);

  // Render Data on map whenever analysisResult or activeTimestep changes
  useEffect(() => {
    if (!mapInstanceRef.current || !analysisResult) return;
    const map = mapInstanceRef.current;

    // Clear previous layers
    slickLayerGroupRef.current.clearLayers();
    vesselsLayerGroupRef.current.clearLayers();
    driftLayerGroupRef.current.clearLayers();
    uncertaintyLayerGroupRef.current.clearLayers();
    particlesLayerGroupRef.current.clearLayers();
    originMarkerGroupRef.current.clearLayers();

    const centre = analysisResult.metrics.centre;

    // 1. Render Detected Slick Polygon
    if (analysisResult.slickContour?.geometry?.coordinates?.[0]) {
      const coords = analysisResult.slickContour.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
      
      const isHeatmapOnly = visMode === 'heatmap';
      const isHybrid = visMode === 'hybrid';

      const slickPolygon = L.polygon(coords, {
        color: isHeatmapOnly ? '#38bdf8' : '#06b6d4',
        weight: isHeatmapOnly ? 1.5 : 2.5,
        fillColor: isHeatmapOnly ? '#0284c7' : '#0891b2',
        fillOpacity: isHeatmapOnly ? 0.08 : isHybrid ? 0.35 : 0.6,
        dashArray: isHeatmapOnly ? '3, 6' : '4, 4',
      });

      slickPolygon.bindPopup(`
        <div style="font-family: monospace; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong style="color: #0891b2;">CONFIRMED SAR SLICK CONTOUR</strong><br/>
          <strong>Area:</strong> ${analysisResult.metrics.areaKm2} km² (${analysisResult.metrics.areaHectares} ha)<br/>
          <strong>Backscatter Damping:</strong> -${analysisResult.slickContour.properties.dampingRatioDb} dB<br/>
          <strong>Confidence:</strong> ${analysisResult.detection.confidenceScore}% (${analysisResult.detection.confidenceRating})<br/>
          <strong>Centroid:</strong> ${centre.lat.toFixed(4)}°N, ${centre.lng.toFixed(4)}°E
        </div>
      `);

      slickPolygon.addTo(slickLayerGroupRef.current);

      // Add slick centroid pulse marker
      const pulseIcon = L.divIcon({
        className: 'custom-slick-centroid-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(6, 182, 212, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 6px; left: 6px; width: 12px; height: 12px; border-radius: 9999px; background-color: #06b6d4; border: 2px solid white;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([centre.lat, centre.lng], { icon: pulseIcon })
        .bindPopup(`<b>Slick Centroid:</b> ${centre.lat.toFixed(4)}°, ${centre.lng.toFixed(4)}°`)
        .addTo(slickLayerGroupRef.current);
    }

    // 2. Render Backtracked Source Origin
    if (analysisResult.sourceEstimation?.backtrackedOrigin) {
      const origin = analysisResult.sourceEstimation.backtrackedOrigin;
      
      // Radius circle
      const originCircle = L.circle([origin.lat, origin.lng], {
        radius: (analysisResult.sourceEstimation.originUncertaintyRadiusKm || 1.5) * 1000,
        color: '#f59e0b',
        weight: 1.5,
        fillColor: '#fbbf24',
        fillOpacity: 0.15,
        dashArray: '6, 6',
      });
      originCircle.bindPopup(`<b>Backtracked Origin Zone:</b> Radius ${analysisResult.sourceEstimation.originUncertaintyRadiusKm} km`);
      originCircle.addTo(originMarkerGroupRef.current);

      const originIcon = L.divIcon({
        className: 'origin-marker',
        html: `
          <div style="background-color: #f59e0b; color: #000; border: 2px solid #fff; border-radius: 8px; padding: 2px 6px; font-weight: bold; font-family: monospace; font-size: 10px; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.4);">
            ORIGIN (T - ${analysisResult.sourceEstimation.estimatedSpillTime ? 'Backtrack' : '0'})
          </div>
        `,
        iconSize: [80, 20],
        iconAnchor: [40, 10],
      });

      L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(originMarkerGroupRef.current);
    }

    // 3. Render Candidate Vessels & AIS Tracks
    if (analysisResult.candidates && analysisResult.candidates.length > 0) {
      analysisResult.candidates.forEach((cand, idx) => {
        const isCritical = cand.riskLevel === 'CRITICAL';
        const isHigh = cand.riskLevel === 'HIGH';
        const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#3b82f6';

        // Historical track
        if (cand.historicalTrack && cand.historicalTrack.length > 1) {
          const trackLatLngs = cand.historicalTrack.map((pt) => [pt.lat, pt.lng] as [number, number]);
          const trackLine = L.polyline(trackLatLngs, {
            color,
            weight: isCritical ? 2.5 : 1.5,
            opacity: 0.8,
            dashArray: cand.aisAnomaly ? '5, 5' : undefined,
          });
          trackLine.addTo(vesselsLayerGroupRef.current);
        }

        // Vessel marker
        const vesselIcon = L.divIcon({
          className: 'vessel-marker',
          html: `
            <div style="background-color: ${color}; color: #ffffff; border: 2px solid #ffffff; border-radius: 6px; padding: 3px 6px; font-family: monospace; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px;">
              <span>🚢 ${cand.vesselName}</span>
              ${cand.aisAnomaly ? '<span style="background: yellow; color: black; border-radius: 4px; padding: 0 2px; font-size: 8px;">AIS GAP</span>' : ''}
            </div>
          `,
          iconSize: [110, 24],
          iconAnchor: [55, 12],
        });

        const marker = L.marker([cand.coordinates.lat, cand.coordinates.lng], { icon: vesselIcon });
        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 12px; color: #0f172a; padding: 4px;">
            <strong style="color: ${color};">${cand.vesselName} (${cand.flag})</strong><br/>
            <strong>MMSI:</strong> ${cand.mmsi} | <strong>IMO:</strong> ${cand.imo}<br/>
            <strong>Type:</strong> ${cand.vesselType}<br/>
            <strong>Speed:</strong> ${cand.speedKnots} kn @ ${cand.headingDeg}°<br/>
            <strong>Closest Point (CPA):</strong> ${cand.closestPointDistanceKm} km<br/>
            <strong>Liability Score:</strong> ${cand.trajectoryMatchScore}% (${cand.riskLevel})<br/>
            ${cand.anomalyReason ? `<div style="margin-top: 4px; padding: 4px; background: #fee2e2; color: #991b1b; border-radius: 4px;"><strong>AIS Alert:</strong> ${cand.anomalyReason}</div>` : ''}
          </div>
        `);

        if (onSelectCandidate) {
          marker.on('click', () => onSelectCandidate(cand.id));
        }

        marker.addTo(vesselsLayerGroupRef.current);
      });
    }

    // 4. Render Drift Trajectory Path
    if (analysisResult.driftSimulation?.trajectory?.length) {
      const trajectory = analysisResult.driftSimulation.trajectory;
      const trajectoryPoints = trajectory.map((step) => [step.centroid.lat, step.centroid.lng] as [number, number]);

      // Path polyline
      const driftLine = L.polyline(trajectoryPoints, {
        color: '#10b981',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 6',
      });
      driftLine.addTo(driftLayerGroupRef.current);

      // Trajectory step markers
      trajectory.forEach((step, idx) => {
        const isCurrentStep = idx === activeTimestep;
        const stepIcon = L.divIcon({
          className: 'drift-step-marker',
          html: `
            <div style="background-color: ${isCurrentStep ? '#10b981' : '#064e3b'}; color: #fff; border: 2px solid ${isCurrentStep ? '#34d399' : '#a7f3d0'}; border-radius: 9999px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; font-family: monospace; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">
              +${step.timestepHours}h
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        L.marker([step.centroid.lat, step.centroid.lng], { icon: stepIcon })
          .bindPopup(`
            <div style="font-family: monospace; font-size: 11px;">
              <strong>Drift Step: +${step.timestepHours} Hours</strong><br/>
              Centroid: ${step.centroid.lat.toFixed(4)}°, ${step.centroid.lng.toFixed(4)}°<br/>
              Spread Area: ${step.areaKm2} km²<br/>
              Evaporation: ${step.evaporationPercentage}%<br/>
              Major Dispersion Axis: ${step.majorAxisKm} km
            </div>
          `)
          .addTo(driftLayerGroupRef.current);
      });

      // 5. Render Uncertainty Area Polygon for active or final timestep
      const selectedStep = trajectory[activeTimestep] || trajectory[trajectory.length - 1];
      if (selectedStep?.uncertaintyPolygon) {
        const poly = L.polygon(selectedStep.uncertaintyPolygon, {
          color: '#eab308',
          weight: 1.5,
          fillColor: '#fef08a',
          fillOpacity: 0.25,
          dashArray: '4, 4',
        });
        poly.bindPopup(`<b>95% Covariance Uncertainty Envelope (+${selectedStep.timestepHours}h):</b> Wind variance ±2.5 m/s`);
        poly.addTo(uncertaintyLayerGroupRef.current);
      }

      // 6. Render Animated Lagrangian Particles
      if (selectedStep?.particles) {
        selectedStep.particles.forEach((p) => {
          const particleMarker = L.circleMarker([p.lat, p.lng], {
            radius: 3,
            color: '#34d399',
            fillColor: '#10b981',
            fillOpacity: p.massFractionRemaining || 0.8,
            weight: 1,
          });
          particleMarker.bindPopup(`<b>Lagrangian Particle #${p.id}</b><br/>Mass Remaining: ${(p.massFractionRemaining * 100).toFixed(0)}%`);
          particleMarker.addTo(particlesLayerGroupRef.current);
        });
      }
    }

    // Fit bounds smoothly to area
    map.panTo([centre.lat, centre.lng], { animate: true });
  }, [analysisResult, activeTimestep, onSelectCandidate, visMode]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetCenter = () => {
    if (analysisResult?.metrics.centre && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([analysisResult.metrics.centre.lat, analysisResult.metrics.centre.lng], 11);
    }
  };

  return (
    <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[680px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-slate-950">
      
      {/* Leaflet Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* D3.js Spill Concentration Heatmap Overlay */}
      <D3SpillHeatmap
        map={leafletMap}
        analysisResult={analysisResult}
        activeTimestep={activeTimestep}
        visualizationMode={visMode}
        colorScale={activeColorScale}
        opacity={activeOpacity}
        onHoverPoint={setHoveredPointInfo}
      />

      {/* Top Mandatory Satellite Labels Banner */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-cyan-800/60 text-cyan-300 text-xs font-mono font-medium shadow-lg pointer-events-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Latest available satellite imagery</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-amber-800/50 text-amber-300 text-xs font-mono font-medium shadow-lg pointer-events-auto hidden sm:flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Satellite imagery is not real-time video</span>
        </div>
      </div>

      {/* Top Center: Tactical Visualization Mode Switcher */}
      <div className="absolute top-14 sm:top-3 left-3 sm:left-1/2 sm:-translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl">
        <button
          onClick={() => handleSetVisMode('raw')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
            visMode === 'raw'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-900/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Raw Synthetic Aperture Radar Backscatter Suppression"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Raw SAR</span>
        </button>

        <button
          onClick={() => handleSetVisMode('heatmap')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
            visMode === 'heatmap'
              ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-rose-950/60'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          title="D3.js Spill Concentration Density Heatmap (IMO Bonn Standard)"
        >
          <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>D3 Heatmap</span>
        </button>

        <button
          onClick={() => handleSetVisMode('hybrid')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
            visMode === 'hybrid'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Dual Fusion: Raw Radar Boundaries with D3 Density Contours"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>Hybrid</span>
        </button>
      </div>

      {/* Bottom Left: Interactive D3 Spill Concentration Legend (when heatmap or hybrid active) */}
      {(visMode === 'heatmap' || visMode === 'hybrid') && showDensityLegend && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[320px] bg-slate-950/92 backdrop-blur-md border border-cyan-800/50 rounded-xl p-3 shadow-2xl text-xs font-mono text-slate-300">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>D3 Spill Density Scale</span>
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              IMO Bonn Standard
            </span>
          </div>

          {/* Color ramp swatches */}
          <div className="space-y-1 mb-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8] border border-cyan-300/40"></span>
                <span className="text-slate-300">Code 1: Silvery Sheen</span>
              </div>
              <span className="text-slate-400 font-bold">0.04 - 0.3 µm</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#fbbf24] border border-amber-300/40"></span>
                <span className="text-slate-300">Code 2: Rainbow Iridescence</span>
              </div>
              <span className="text-slate-400 font-bold">0.3 - 5.0 µm</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f97316] border border-orange-300/40"></span>
                <span className="text-slate-300">Code 3: Metallic Sheen</span>
              </div>
              <span className="text-slate-400 font-bold">5 - 50 µm</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444] border border-red-300/40"></span>
                <span className="text-slate-300">Code 4: True Oil Slick</span>
              </div>
              <span className="text-slate-400 font-bold">50 - 200 µm</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#881337] border border-rose-400/40"></span>
                <span className="text-slate-300 font-bold text-rose-300">Code 5: Heavy Emulsion</span>
              </div>
              <span className="text-rose-400 font-bold">&gt; 200 µm</span>
            </div>
          </div>

          {/* Live Hover Readout or Peak Stats */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            {hoveredPointInfo ? (
              <div className="flex items-center gap-1.5 text-cyan-300 w-full justify-between">
                <span>Cursor: <strong className="text-white">{hoveredPointInfo.concentration} g/m²</strong></span>
                <span className="text-amber-300 font-bold">{hoveredPointInfo.thickness}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 w-full justify-between">
                <span>Peak Core: <strong className="text-rose-400">~280 g/m²</strong></span>
                <span>Area: <strong className="text-slate-200">{analysisResult?.metrics?.areaKm2 || 18.6} km²</strong></span>
              </div>
            )}
          </div>

          {/* Quick Palette and Opacity controls */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Palette:</span>
              <select
                value={activeColorScale}
                onChange={(e) => handleSetColorScale(e.target.value as HeatmapColorScale)}
                className="bg-slate-900 text-cyan-300 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
              >
                <option value="bonn">IMO Bonn</option>
                <option value="inferno">Inferno</option>
                <option value="turbo">Turbo</option>
                <option value="plasma">Plasma</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={activeOpacity}
                onChange={(e) => handleSetOpacity(parseFloat(e.target.value))}
                className="w-16 accent-amber-500 cursor-pointer h-1"
              />
              <span className="text-slate-400 w-6 text-right">{(activeOpacity * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Raw SAR Info HUD (when in raw SAR mode) */}
      {visMode === 'raw' && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[280px] bg-slate-950/90 backdrop-blur-md border border-cyan-800/60 rounded-xl p-3 shadow-2xl text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Raw SAR Backscatter Footprint</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <p>Damping: <strong className="text-cyan-300">-{analysisResult?.slickContour?.properties?.dampingRatioDb || 7.8} dB</strong></p>
            <p>Sensor: <strong className="text-slate-200">{analysisResult?.sarMetadata?.satelliteName || 'Sentinel-1B'} ({analysisResult?.sarMetadata?.polarization || 'VV'})</strong></p>
            <p>CFAR Confidence: <strong className="text-emerald-400">{analysisResult?.detection?.confidenceScore || 94.2}%</strong></p>
          </div>
        </div>
      )}

      {/* Custom Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        
        {/* Basemap Switcher */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl flex flex-col gap-1">
          <button
            onClick={() => setBaseMapType('satellite')}
            title="Satellite Imagery"
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
              baseMapType === 'satellite' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBaseMapType('dark')}
            title="Nautical Dark Mode"
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
              baseMapType === 'dark' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Dark Chart
          </button>
          <button
            onClick={() => setBaseMapType('street')}
            title="Standard Coastal Map"
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
              baseMapType === 'street' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Street
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Center on Slick"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

      </div>

      {/* Layer Visibility Controls & Legend (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 max-w-[280px] bg-slate-950/90 backdrop-blur-md border border-cyan-900/40 rounded-xl p-3 shadow-2xl text-xs font-mono text-slate-300">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>GIS Map Layers</span>
          </span>
          <span className="text-[10px] text-slate-500">WGS84</span>
        </div>

        <div className="space-y-1.5">
          {/* Slick Layer Toggle */}
          <button
            onClick={() => setShowSlick(!showSlick)}
            className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500/80 border border-cyan-300"></span>
              <span>Detected Slick</span>
            </div>
            {showSlick ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* D3 Heatmap Toggle (if in heatmap/hybrid mode) */}
          {(visMode === 'heatmap' || visMode === 'hybrid') && (
            <button
              onClick={() => setShowDensityLegend(!showDensityLegend)}
              className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800 text-amber-300"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-rose-600 border border-amber-300"></span>
                <span>D3 Heatmap Legend</span>
              </div>
              {showDensityLegend ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          )}

          {/* Vessels Layer Toggle */}
          <button
            onClick={() => setShowVessels(!showVessels)}
            className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500 border border-red-300"></span>
              <span>Candidate AIS Vessels</span>
            </div>
            {showVessels ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Drift Trajectory Toggle */}
          <button
            onClick={() => setShowDrift(!showDrift)}
            className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-300"></span>
              <span>Drift Path (+48h)</span>
            </div>
            {showDrift ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Uncertainty Envelope Toggle */}
          <button
            onClick={() => setShowUncertainty(!showUncertainty)}
            className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-400/40 border border-amber-300"></span>
              <span>95% Uncertainty Area</span>
            </div>
            {showUncertainty ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Particles Toggle */}
          <button
            onClick={() => setShowParticles(!showParticles)}
            className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Lagrangian Particles</span>
            </div>
            {showParticles ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

    </div>
  );
};
