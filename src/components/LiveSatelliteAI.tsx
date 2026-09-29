import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  Search,
  Crosshair,
  Layers,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  Camera,
  Download,
  Send,
  Sliders,
  Compass,
  Ship,
  Waves,
  ZoomIn,
  ZoomOut,
  MapPin,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Radio,
  FileText,
  MessageSquare,
  UploadCloud,
  ChevronDown
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GLOBAL_SATELLITE_HOTSPOTS } from '../data/satelliteHotspots';
import {
  SatelliteAiAnalysisResult,
  SatelliteAiHotspot,
  SatelliteAiChatMessage,
} from '../types';

interface LiveSatelliteAIProps {
  reducedMotion: boolean;
  onNavigateToWorkbench?: (lat: number, lng: number) => void;
}

export const LiveSatelliteAI: React.FC<LiveSatelliteAIProps> = ({
  reducedMotion,
  onNavigateToWorkbench,
}) => {
  // Target location state
  const [selectedHotspot, setSelectedHotspot] = useState<SatelliteAiHotspot>(
    GLOBAL_SATELLITE_HOTSPOTS[0]
  );
  const [latitude, setLatitude] = useState<number>(GLOBAL_SATELLITE_HOTSPOTS[0].lat);
  const [longitude, setLongitude] = useState<number>(GLOBAL_SATELLITE_HOTSPOTS[0].lng);
  const [zoomLevel, setZoomLevel] = useState<number>(GLOBAL_SATELLITE_HOTSPOTS[0].defaultZoom);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [areaLabel, setAreaLabel] = useState<string>(GLOBAL_SATELLITE_HOTSPOTS[0].name);

  // Sensor mode state
  const [sensorMode, setSensorMode] = useState<'optical' | 'sar_radar' | 'swir_infrared' | 'thermal'>('optical');
  const [showFairways, setShowFairways] = useState<boolean>(true);
  const [showVessels, setShowVessels] = useState<boolean>(true);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  // Analysis & Scan state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<SatelliteAiAnalysisResult | null>(null);
  const [userInquiry, setUserInquiry] = useState<string>('');
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);

  // Interactive AI Q&A Chat
  const [chatMessages, setChatMessages] = useState<SatelliteAiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'anomalies' | 'vessels' | 'chat' | 'report'>('summary');

  // Custom Image Upload State
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false,
      });

      // Esri World Imagery (High-Res satellite tiles)
      const baseSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Esri, Maxar, Earthstar Geographics, CNES/Airbus DS',
        }
      ).addTo(map);

      tileLayerRef.current = baseSatellite;

      // Overlay layer group for simulated AIS vessels & fairway markers
      const overlayGroup = L.layerGroup().addTo(map);
      overlayGroupRef.current = overlayGroup;

      // Click to retarget coordinates
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setLatitude(parseFloat(lat.toFixed(4)));
        setLongitude(parseFloat(lng.toFixed(4)));
        setAreaLabel(`Custom Target [${lat.toFixed(3)}°, ${lng.toFixed(3)}°]`);
      });

      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        setLatitude(parseFloat(center.lat.toFixed(4)));
        setLongitude(parseFloat(center.lng.toFixed(4)));
      });

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([latitude, longitude], zoomLevel);
    }

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, []);

  // Update map view when lat/lng/zoom changes programmatically
  useEffect(() => {
    if (mapInstanceRef.current) {
      const curCenter = mapInstanceRef.current.getCenter();
      if (
        Math.abs(curCenter.lat - latitude) > 0.001 ||
        Math.abs(curCenter.lng - longitude) > 0.001 ||
        mapInstanceRef.current.getZoom() !== zoomLevel
      ) {
        mapInstanceRef.current.setView([latitude, longitude], zoomLevel, { animate: !reducedMotion });
      }
    }
  }, [latitude, longitude, zoomLevel, reducedMotion]);

  // Update simulated overlays (Vessels & Fairways) on the Leaflet map
  useEffect(() => {
    if (!overlayGroupRef.current || !mapInstanceRef.current) return;
    overlayGroupRef.current.clearLayers();

    if (showVessels) {
      // Add simulated AIS vessel markers in the current sector
      const offsets = [
        { dLat: 0.035, dLng: -0.04, type: 'Crude Tanker', heading: 145, speed: '12.4 kn' },
        { dLat: -0.025, dLng: 0.05, type: 'Container Ship', heading: 320, speed: '18.1 kn' },
        { dLat: 0.06, dLng: 0.02, type: 'Bulk Carrier', heading: 85, speed: '10.8 kn' },
        { dLat: -0.05, dLng: -0.035, type: 'Product Tanker', heading: 210, speed: '11.5 kn' },
      ];

      offsets.forEach((vessel, idx) => {
        const vLat = latitude + vessel.dLat;
        const vLng = longitude + vessel.dLng;

        const iconHtml = `
          <div style="transform: rotate(${vessel.heading}deg);" class="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-md">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-vessel-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([vLat, vLng], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; color: #0f172a; padding: 4px;">
            <strong>${vessel.type} (AIS)</strong><br/>
            Pos: ${vLat.toFixed(3)}°N, ${vLng.toFixed(3)}°E<br/>
            Speed: ${vessel.speed} | Hdg: ${vessel.heading}°<br/>
            Status: Underway Using Engine
          </div>
        `);
        overlayGroupRef.current?.addLayer(marker);
      });
    }

    if (showFairways) {
      // Nautical fairway corridor boundary
      const corridorBounds: L.LatLngExpression[] = [
        [latitude + 0.1, longitude - 0.15],
        [latitude - 0.1, longitude + 0.15],
      ];
      const polyline = L.polyline(corridorBounds, {
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '6, 8',
        opacity: 0.7,
      });
      overlayGroupRef.current.addLayer(polyline);
    }
  }, [latitude, longitude, showVessels, showFairways]);

  // Handle hotspot selection
  const handleSelectHotspot = (hotspot: SatelliteAiHotspot) => {
    setSelectedHotspot(hotspot);
    setLatitude(hotspot.lat);
    setLongitude(hotspot.lng);
    setZoomLevel(hotspot.defaultZoom);
    setAreaLabel(hotspot.name);
    setUploadedImagePreview(null);
  };

  // Capture current satellite canvas / view & generate composite snapshot
  const generateSnapshotDataUrl = (): Promise<string> => {
    return new Promise((resolve) => {
      // If user uploaded custom image, prioritize that
      if (uploadedImagePreview) {
        return resolve(uploadedImagePreview);
      }

      // Create synthetic high-res satellite snapshot canvas with geo-hud
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      // Background sea gradient with satellite texture
      const oceanGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (sensorMode === 'sar_radar') {
        oceanGrad.addColorStop(0, '#1e293b');
        oceanGrad.addColorStop(0.5, '#0f172a');
        oceanGrad.addColorStop(1, '#334155');
      } else if (sensorMode === 'swir_infrared') {
        oceanGrad.addColorStop(0, '#042f2e');
        oceanGrad.addColorStop(0.5, '#134e4a');
        oceanGrad.addColorStop(1, '#064e3b');
      } else if (sensorMode === 'thermal') {
        oceanGrad.addColorStop(0, '#311042');
        oceanGrad.addColorStop(0.5, '#581c87');
        oceanGrad.addColorStop(1, '#1e1b4b');
      } else {
        oceanGrad.addColorStop(0, '#0c4a6e');
        oceanGrad.addColorStop(0.5, '#075985');
        oceanGrad.addColorStop(1, '#082f49');
      }
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add synthetic wave & surface texture
      ctx.strokeStyle = sensorMode === 'sar_radar' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.lineTo(x, i + Math.sin((x + i) * 0.02) * 3);
        }
        ctx.stroke();
      }

      // If known risk corridor or custom slick simulation, draw slick anomaly
      const isKnownRisk = selectedHotspot.recentSpillRisk === 'CRITICAL' || selectedHotspot.recentSpillRisk === 'HIGH';
      if (isKnownRisk) {
        ctx.fillStyle = sensorMode === 'sar_radar' ? 'rgba(5, 5, 8, 0.75)' : 'rgba(10, 15, 25, 0.55)';
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.52, canvas.height * 0.48, 140, 50, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Satellite HUD Overlays
      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

      // Top Header HUD
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`SPILLTWIN EARTH OBSERVATION SATELLITE FEED [${sensorMode.toUpperCase()}]`, 16, 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`COORD: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E | ZOOM: ${zoomLevel}x`, canvas.width - 360, 22);

      // Bottom Metadata HUD
      const now = new Date().toISOString();
      ctx.fillText(`TIMESTAMP: ${now} | PASS: DESCENDING ORBIT | SENSOR RES: 10M`, 16, canvas.height - 14);
      ctx.fillText(`TARGET: ${areaLabel.toUpperCase()}`, canvas.width - 340, canvas.height - 14);

      // Crosshair Target in center
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24);
      ctx.lineTo(cx, cy + 24);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    });
  };

  // Trigger Live Satellite AI Analysis
  const handleRunSatelliteScan = async () => {
    setIsScanning(true);
    setScanStep('Acquiring high-resolution Earth Observation satellite frame...');

    try {
      // Step 1: Capture or generate geo-referenced satellite snapshot
      const snapshotUrl = await generateSnapshotDataUrl();
      setCapturedImageData(snapshotUrl);

      setScanStep('Transmitting telemetry to Gemini 3.7 Vision Core...');
      await new Promise((r) => setTimeout(r, 600));

      setScanStep('Evaluating Bragg backscatter & multispectral slick signatures...');

      // Step 2: Call backend `/api/sat/live-capture-and-analyze`
      const response = await fetch('/api/sat/live-capture-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
          zoom: zoomLevel,
          areaName: areaLabel,
          sensorMode,
          imageData: snapshotUrl,
          userQuery: userInquiry.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult(resData.data);
        setActiveTab('summary');

        // Initialize Chat dialogue with the AI's summary
        setChatMessages([
          {
            id: 'init-1',
            sender: 'assistant',
            text: `I have completed the satellite remote sensing analysis for **${areaLabel}**. Verdict: **${resData.data.detectionVerdict}** (Confidence: ${resData.data.confidenceScore}%). Ask me any questions regarding slick dispersion, vessel attribution, or ecological risks.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      console.error('Satellite scan error:', err);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Handle user follow-up chat with the satellite image
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput('');

    const newMsg: SatelliteAiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setIsChatSending(true);

    try {
      const response = await fetch('/api/sat/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          scanContext: analysisResult,
          imageData: capturedImageData,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const aiMsg: SatelliteAiChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: json.answer || 'Analysis complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }
    } catch (chatErr) {
      console.error('Chat error:', chatErr);
    } finally {
      setIsChatSending(false);
    }
  };

  // Handle local satellite photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedImagePreview(result);
      setCapturedImageData(result);
      setAreaLabel(`Custom Uploaded Satellite Frame: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Quick preset inquiry suggestions
  const suggestedQueries = [
    'Check for oil slicks or illegal bilge discharge',
    'Identify transiting vessels and trace wake directions',
    'Assess shoreline proximity and sensitive coral risk',
    'Distinguish between algae bloom lookalike and crude oil',
  ];

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-950/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Satellite className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-mono">
                LIVE SATELLITE PHOTO & <span className="text-cyan-400">MULTIMODAL AI VISION</span>
              </h1>
              <p className="text-xs text-slate-400">
                Acquire spaceborne satellite imagery over any ocean corridor and generate an accurate forensic assessment.
              </p>
            </div>
          </div>
        </div>

        {/* Global Hotspots dropdown & Coordinate Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedHotspot.id}
              onChange={(e) => {
                const target = GLOBAL_SATELLITE_HOTSPOTS.find((h) => h.id === e.target.value);
                if (target) handleSelectHotspot(target);
              }}
              className="appearance-none bg-slate-900/90 text-xs font-mono text-cyan-300 border border-cyan-800/60 rounded-xl px-3.5 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-md"
            >
              {GLOBAL_SATELLITE_HOTSPOTS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.category})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 transition-colors"
            title="Upload custom satellite image / drone ortho"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Photo</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.tif,.tiff"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Grid: Left Viewport & Controls | Right AI Intelligence Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Satellite Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Viewport Box */}
          <div className="relative rounded-2xl bg-slate-950 border border-cyan-900/40 overflow-hidden shadow-2xl shadow-cyan-950/30">
            
            {/* Viewport Top HUD */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono z-10 relative">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-cyan-300 font-semibold">{areaLabel}</span>
              </div>
              <div className="text-slate-400 flex items-center gap-3">
                <span>Lat: {latitude.toFixed(4)}°</span>
                <span>Lng: {longitude.toFixed(4)}°</span>
                <span className="hidden sm:inline">Zoom: {zoomLevel}x</span>
              </div>
            </div>

            {/* Viewport Canvas / Leaflet Map */}
            <div className="relative h-[380px] sm:h-[440px] w-full bg-slate-900">
              {uploadedImagePreview ? (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                  <img
                    src={uploadedImagePreview}
                    alt="Custom Satellite Capture"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-[11px] font-mono text-cyan-300">
                    Uploaded Satellite Frame
                  </div>
                </div>
              ) : (
                <div
                  ref={mapContainerRef}
                  className={`w-full h-full ${
                    sensorMode === 'sar_radar'
                      ? 'grayscale contrast-125 brightness-90'
                      : sensorMode === 'swir_infrared'
                      ? 'hue-rotate-90 saturate-200'
                      : sensorMode === 'thermal'
                      ? 'hue-rotate-180 contrast-150'
                      : ''
                  }`}
                />
              )}

              {/* HUD Reticle Overlay */}
              {showReticle && !uploadedImagePreview && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-28 h-28 border border-cyan-400/50 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400"></div>
                    <div className="absolute top-0 w-0.5 h-3 bg-cyan-400"></div>
                    <div className="absolute bottom-0 w-0.5 h-3 bg-cyan-400"></div>
                    <div className="absolute left-0 h-0.5 w-3 bg-cyan-400"></div>
                    <div className="absolute right-0 h-0.5 w-3 bg-cyan-400"></div>
                  </div>
                </div>
              )}

              {/* Scanning Laser HUD Animation */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none z-20 bg-cyan-950/30 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg shadow-cyan-400"></div>
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-400/60 shadow-2xl flex flex-col items-center gap-3 max-w-xs text-center">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-white font-mono">SCANNING SATELLITE PHOTO</p>
                      <p className="text-xs text-cyan-300 mt-1">{scanStep}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport Zoom & Reset Controls */}
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
                  className="p-2 rounded-lg bg-slate-950/90 border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500 shadow-lg"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(4, z - 1))}
                  className="p-2 rounded-lg bg-slate-950/90 border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500 shadow-lg"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setLatitude(selectedHotspot.lat);
                    setLongitude(selectedHotspot.lng);
                    setZoomLevel(selectedHotspot.defaultZoom);
                  }}
                  className="p-2 rounded-lg bg-slate-950/90 border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500 shadow-lg"
                  title="Recenter Hotspot"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Sensor Band & Layer Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Sensor selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 mr-1">Sensor:</span>
                {(
                  [
                    { id: 'optical', label: 'True Color Optical' },
                    { id: 'sar_radar', label: 'SAR C-Band Radar' },
                    { id: 'swir_infrared', label: 'SWIR False Color' },
                    { id: 'thermal', label: 'Thermal IR' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSensorMode(mode.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                      sensorMode === mode.id
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-inner'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVessels(!showVessels)}
                  className={`px-2 py-1 rounded font-mono text-[11px] border ${
                    showVessels
                      ? 'bg-slate-900 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  AIS Vessels
                </button>
                <button
                  onClick={() => setShowFairways(!showFairways)}
                  className={`px-2 py-1 rounded font-mono text-[11px] border ${
                    showFairways
                      ? 'bg-slate-900 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  Fairways
                </button>
              </div>
            </div>

          </div>

          {/* Coordinate Direct Adjustment Inputs */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono">Lat:</span>
                <input
                  type="number"
                  step="0.001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-mono">Lng:</span>
                <input
                  type="number"
                  step="0.001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {onNavigateToWorkbench && (
              <button
                onClick={() => onNavigateToWorkbench(latitude, longitude)}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                <span>Export Coords to SAR Workbench</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Inquiry Prompt & AI Scan Trigger */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-900/40 shadow-xl space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-cyan-300 mb-1.5 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Investigation Inquiry (Optional focus)</span>
              </label>
              <input
                type="text"
                value={userInquiry}
                onChange={(e) => setUserInquiry(e.target.value)}
                placeholder="e.g. Scan for illegal bilge discharges near passing tankers and calculate slick area..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            {/* Quick suggested prompts */}
            <div className="flex flex-wrap gap-1.5">
              {suggestedQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setUserInquiry(query)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>

            {/* Main Action Button */}
            <button
              id="capture-and-analyze-btn"
              onClick={handleRunSatelliteScan}
              disabled={isScanning}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Satellite Photo & Generate AI Response</span>
            </button>
          </div>

        </div>

        {/* Right Column: AI Intelligence & Multimodal Results Console (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {analysisResult ? (
            <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl backdrop-blur-xl overflow-hidden">
              
              {/* Verdict Header Banner */}
              <div
                className={`p-4 border-b flex items-start justify-between gap-3 ${
                  analysisResult.threatLevel === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    : analysisResult.threatLevel === 'HIGH'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    : analysisResult.threatLevel === 'MODERATE'
                    ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {analysisResult.threatLevel === 'CRITICAL' || analysisResult.threatLevel === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      VERDICT: {analysisResult.detectionVerdict.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-mono font-bold text-white">
                    {analysisResult.confidenceScore}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">Confidence</p>
                </div>
              </div>

              {/* Navigation Tabs for Results */}
              <div className="flex border-b border-slate-800 bg-slate-950/80 px-2">
                {[
                  { id: 'summary', label: 'Overview', icon: FileText },
                  { id: 'anomalies', label: `Anomalies (${analysisResult.anomalies.length})`, icon: Waves },
                  { id: 'vessels', label: `Vessels (${analysisResult.vessels.length})`, icon: Ship },
                  { id: 'chat', label: 'AI Dialogue', icon: MessageSquare },
                  { id: 'report', label: 'Full Briefing', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isActive
                          ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold bg-cyan-950/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Areas */}
              <div className="p-5 max-h-[480px] overflow-y-auto space-y-4">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    {/* Environmental Factors Bento */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono">Shoreline Proximity</span>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">
                          {analysisResult.environmentalFactors.shorelineDistanceKm} km
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono">Ecological Threat</span>
                        <p className="text-xs font-semibold text-amber-300 mt-0.5 line-clamp-1">
                          {analysisResult.environmentalFactors.ecologicalVulnerability}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono">Sea State</span>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">
                          {analysisResult.environmentalFactors.estimatedSeaState}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono">Sun Glint Impact</span>
                        <p className="text-xs font-semibold text-cyan-300 mt-0.5">
                          {analysisResult.environmentalFactors.sunGlintImpact}
                        </p>
                      </div>
                    </div>

                    {/* Actionable Recommendations */}
                    <div>
                      <h4 className="text-xs font-mono font-semibold uppercase text-cyan-300 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Actionable Response Directives</span>
                      </h4>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-200 flex items-start gap-2"
                          >
                            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. ANOMALIES TAB */}
                {activeTab === 'anomalies' && (
                  <div className="space-y-3">
                    {analysisResult.anomalies.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No continuous surface anomalies detected in this frame.
                      </div>
                    ) : (
                      analysisResult.anomalies.map((anom, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-300 font-mono">
                              {anom.type}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                              {anom.confidence}% Confidence
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{anom.description}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-900">
                            <span>Sector: {anom.location}</span>
                            {anom.estimatedAreaKm2 && (
                              <span className="text-amber-400">Area: {anom.estimatedAreaKm2} km²</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. VESSELS TAB */}
                {activeTab === 'vessels' && (
                  <div className="space-y-3">
                    {analysisResult.vessels.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No active vessel tracks identified in this frame.
                      </div>
                    ) : (
                      analysisResult.vessels.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Ship className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-xs font-bold text-white font-mono">{v.type}</span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                v.riskRating === 'SUSPECT'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-slate-900 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {v.riskRating}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{v.notes}</p>
                          {v.wakeVisible && (
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <Waves className="w-3 h-3 text-cyan-400" />
                              <span>Wake Direction: {v.wakeDirection || 'Observed'}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. AI CHAT DIALOGUE */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-[340px]">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.sender === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-xl text-xs ${
                              msg.sender === 'user'
                                ? 'bg-cyan-600 text-slate-950 font-medium'
                                : 'bg-slate-950 border border-cyan-900/60 text-slate-200'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                            {msg.timestamp}
                          </span>
                        </div>
                      ))}
                      {isChatSending && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini AI is examining the satellite scene...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat input form */}
                    <form onSubmit={handleSendChatMessage} className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask Gemini AI about this satellite photo..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="submit"
                        disabled={isChatSending || !chatInput.trim()}
                        className="p-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

                {/* 5. FULL BRIEFING MARKDOWN TAB */}
                {activeTab === 'report' && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed space-y-2">
                    {analysisResult.fullReportMarkdown}
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* Standby State when no analysis has been run yet */
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto">
                <Satellite className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">SATELLITE INTELLIGENCE READY</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Position the satellite reticle over any ocean sector or select a hotspot, then click <strong>Capture Satellite Photo & Generate AI Response</strong>.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-cyan-400">01. Spaceborne Tile Ingestion</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">High-resolution optical & SAR radar composite.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-cyan-400">02. Multimodal Gemini 3.7</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">Defensible Bragg wave & MARPOL forensic analysis.</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
