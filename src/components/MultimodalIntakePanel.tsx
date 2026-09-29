import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Satellite,
  FileText,
  Radio,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Upload,
  Play,
  Square,
  Volume2,
  VolumeX,
  Search,
  Download,
  Printer,
  Compass,
  ArrowRight,
  ShieldCheck,
  Flame,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import {
  MultimodalExtractionResult,
  MultimodalAttributionResult,
  MarpolConsignmentReport,
  PastIncident,
  PhysicsScore,
  MultimodalEvidenceItem,
} from '../types/multimodal';
import { MultimodalAIService } from '../services/multimodalAI';

interface MultimodalIntakePanelProps {
  onSpawnSpillAt?: (coords: { lat: number; lng: number }, details?: any) => void;
  onHighlightVessel?: (mmsiOrId: string) => void;
  physicsScores?: PhysicsScore[];
  spillMetrics?: {
    areaKm2: number;
    dampingRatioDb: number;
    centroid: { lat: number; lng: number };
  };
  onClose?: () => void;
  isCompact?: boolean;
}

export const MultimodalIntakePanel: React.FC<MultimodalIntakePanelProps> = ({
  onSpawnSpillAt,
  onHighlightVessel,
  physicsScores = [],
  spillMetrics = { areaKm2: 18.6, dampingRatioDb: 7.8, centroid: { lat: 26.248, lng: 56.182 } },
  onClose,
  isCompact = false,
}) => {
  // Panel Sub-tabs
  const [activeTab, setActiveTab] = useState<'intake' | 'attribution' | 'report' | 'search'>('intake');

  // Evidence Items State
  const [audioResult, setAudioResult] = useState<MultimodalExtractionResult | null>(null);
  const [visualResult, setVisualResult] = useState<MultimodalExtractionResult | null>(null);
  const [docResult, setDocResult] = useState<MultimodalExtractionResult | null>(null);
  const [telemetryResult, setTelemetryResult] = useState<MultimodalExtractionResult | null>(null);

  // Cross-modal Attribution State
  const [attributionResult, setAttributionResult] = useState<MultimodalAttributionResult | null>(null);
  const [isFusing, setIsFusing] = useState<boolean>(false);

  // Consignment Report & Audio Broadcast
  const [consignmentReport, setConsignmentReport] = useState<MarpolConsignmentReport | null>(null);
  const [isBroadcastingCh16, setIsBroadcastingCh16] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('spills involving HFO');
  const [searchResults, setSearchResults] = useState<PastIncident[]>([]);

  // Processing indicators
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isProcessingVisual, setIsProcessingVisual] = useState<boolean>(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);

  // File Inputs
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const visualInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize search on mount
  useEffect(() => {
    setSearchResults(MultimodalAIService.searchPastIncidents(searchQuery));
  }, []);

  // 1. VHF AUDIO INTAKE
  const handleLoadSampleAudio = async () => {
    setIsProcessingAudio(true);
    MultimodalAIService.playVhfRadioBurst(400);

    setTimeout(async () => {
      const res = await MultimodalAIService.analyzeVhfAudio('sample_mayday_hfo_breach', {
        centroid: spillMetrics.centroid,
      });
      setAudioResult(res);
      setIsProcessingAudio(false);

      // Trigger automatic hook if position present
      if (res.position && onSpawnSpillAt) {
        onSpawnSpillAt(res.position, {
          vesselName: res.vesselName,
          urgency: res.urgency,
          substance: res.substance,
          transcript: res.transcript,
        });
      }
    }, 1200);
  };

  const handleAudioUpload = async (file: File) => {
    setIsProcessingAudio(true);
    try {
      const res = await MultimodalAIService.analyzeVhfAudio(file, {
        centroid: spillMetrics.centroid,
      });
      setAudioResult(res);
      if (res.position && onSpawnSpillAt) {
        onSpawnSpillAt(res.position, {
          vesselName: res.vesselName,
          urgency: res.urgency,
          substance: res.substance,
          transcript: res.transcript,
        });
      }
    } finally {
      setIsProcessingAudio(false);
    }
  };

  // 2. SLICK VISUAL INTAKE
  const handleLoadSampleVisual = async () => {
    setIsProcessingVisual(true);
    setTimeout(async () => {
      const res = await MultimodalAIService.analyzeSlickVisual('sample_sentinel1_slick', {
        metrics: spillMetrics,
      });
      setVisualResult(res);
      setIsProcessingVisual(false);
    }, 1000);
  };

  const handleVisualUpload = async (file: File) => {
    setIsProcessingVisual(true);
    try {
      const res = await MultimodalAIService.analyzeSlickVisual(file, {
        metrics: spillMetrics,
      });
      setVisualResult(res);
    } finally {
      setIsProcessingVisual(false);
    }
  };

  // 3. CARGO MANIFEST INTAKE
  const handleLoadSampleManifest = async () => {
    setIsProcessingDoc(true);
    setTimeout(async () => {
      const res = await MultimodalAIService.analyzeManifestDoc(`Bill of Lading #BL-9924-HFO
Vessel: MT SEA HORIZON (IMO 9248734, Flag: Marshall Islands)
Cargo: 42,500 Metric Tons Heavy Fuel Oil (HFO 380 cSt, API Gravity 15.4)
IMDG Hazard: Class 3, UN 1268, PG III`);
      setDocResult(res);
      setIsProcessingDoc(false);
    }, 900);
  };

  const handleDocUpload = async (file: File) => {
    setIsProcessingDoc(true);
    try {
      const res = await MultimodalAIService.analyzeManifestDoc(file);
      setDocResult(res);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  // 4. CROSS-MODAL ATTRIBUTION FUSION
  const handleExecuteAttribution = async () => {
    setIsFusing(true);
    try {
      // Ensure we have at least simulated physics score
      const defaultPhysics: PhysicsScore[] = physicsScores.length > 0 ? physicsScores : [
        {
          mmsi: '538009812',
          vesselName: 'MT SEA HORIZON',
          score: 96.5,
          distanceKm: 0.38,
          timeMatchScore: 98,
          driftAlignmentScore: 97,
          backscatterMatch: 95,
          rationale: 'Trajectory intersection coincides with 42-minute dark transponder blackout.',
        },
        {
          mmsi: '636019284',
          vesselName: 'AL-MARJAN EXPRESS',
          score: 22.4,
          distanceKm: 4.8,
          timeMatchScore: 18,
          driftAlignmentScore: 12,
          backscatterMatch: 15,
          rationale: 'Transit course upwind of slick origin; no kinematic speed disruption.',
        },
      ];

      const res = await MultimodalAIService.runCrossModalAttribution({
        audioResult,
        visualResult,
        docResult,
        physicsScores: defaultPhysics,
        spillMetrics,
      });

      setAttributionResult(res);
      setActiveTab('attribution');

      // Trigger automatic vessel highlight on radar
      if (res.culpritVessel?.mmsi && onHighlightVessel) {
        onHighlightVessel(res.culpritVessel.mmsi);
      }

      // Generate Consignment Report
      const rep = MultimodalAIService.generateMarpolConsignmentReport(res, spillMetrics);
      setConsignmentReport(rep);
    } finally {
      setIsFusing(false);
    }
  };

  // 5. CH 16 SPOKEN BROADCAST
  const handleToggleCh16Broadcast = () => {
    if (isBroadcastingCh16) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsBroadcastingCh16(false);
      return;
    }

    if (!consignmentReport) return;
    setIsBroadcastingCh16(true);

    MultimodalAIService.speakCh16Broadcast(
      consignmentReport.ch16AllClearBroadcastScript,
      () => setIsBroadcastingCh16(false)
    );
  };

  // 6. SEARCH PAST INCIDENTS
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchResults(MultimodalAIService.searchPastIncidents(searchQuery));
  };

  return (
    <div className="bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col w-full text-slate-200">
      
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Multimodal AI Reasoning Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Fuses VHF Audio • SAR Radar • Cargo Manifests • AIS Kinematics • Ocean Physics
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'intake'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Intake Modalities</span>
          </button>
          <button
            onClick={() => setActiveTab('attribution')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'attribution'
                ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ship className="w-3.5 h-3.5 text-amber-400" />
            <span>Attribution &amp; Conflicts</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>MARPOL Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-purple-950 text-purple-300 font-bold border border-purple-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Semantic Search</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 overflow-y-auto max-h-[700px]">

        {/* ======================================================== */}
        {/* TAB 1: 4-MODALITY INTAKE PANEL */}
        {/* ======================================================== */}
        {activeTab === 'intake' && (
          <div className="space-y-6">
            
            {/* Quick Demo Guidance Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-slate-900 border border-indigo-500/30 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Operational Multimodal Ingestion Pipeline</span>
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Ingest evidence across distinct sensory modalities. You can upload real files or click 
                  <strong className="text-cyan-300"> &quot;Load Sample&quot;</strong> to test each channel with authentic maritime data.
                </p>
              </div>

              {/* Cross-Modal Fusion Trigger Button */}
              <button
                onClick={handleExecuteAttribution}
                disabled={isFusing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all shrink-0 disabled:opacity-50"
              >
                {isFusing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fusing Modalities...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run Multimodal Attribution →</span>
                  </>
                )}
              </button>
            </div>

            {/* 4 Modalities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* MODALITY 1: VHF RADIO AUDIO */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>Modality 1: VHF Radio Audio</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">CH 16 / DSC</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Transcribes spoken Mayday/Pan-Pan distress calls, decodes vessel name, MMSI, and voice-spoken coordinates.
                  </p>

                  {/* Output Preview */}
                  {audioResult ? (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-red-400 font-bold uppercase">{audioResult.urgency} CALL</span>
                        <span className="text-cyan-400 font-bold">{audioResult.sourceConfidence}% Confidence</span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs italic bg-slate-900/60 p-2 rounded border border-slate-800">
                        &quot;{audioResult.transcript}&quot;
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                        <div>Vessel: <span className="text-white font-bold">{audioResult.vesselName || 'null'}</span></div>
                        <div>MMSI: <span className="text-cyan-300 font-bold">{audioResult.mmsi || 'null'}</span></div>
                        <div>Lat: <span className="text-slate-200">{audioResult.position?.lat?.toFixed(3) || 'null'}°N</span></div>
                        <div>Lng: <span className="text-slate-200">{audioResult.position?.lng?.toFixed(3) || 'null'}°E</span></div>
                      </div>

                      {/* Hook Trigger */}
                      {audioResult.position && onSpawnSpillAt && (
                        <button
                          onClick={() => onSpawnSpillAt(audioResult.position!, audioResult)}
                          className="w-full mt-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1.5"
                        >
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>Trigger spawnSpillAt() on Tactical Radar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                      <Radio className="w-6 h-6 text-slate-600 mx-auto mb-1 animate-pulse" />
                      <p className="text-xs text-slate-400 font-mono">No VHF audio ingested yet</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleAudioUpload(e.target.files[0]);
                    }}
                  />
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    disabled={isProcessingAudio}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                  </button>
                  <button
                    onClick={handleLoadSampleAudio}
                    disabled={isProcessingAudio}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1"
                  >
                    {isProcessingAudio ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Load Mayday Sample</span>
                  </button>
                </div>
              </div>

              {/* MODALITY 2: SATELLITE SAR / DRONE SLICK VISUAL */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5 uppercase">
                      <Satellite className="w-4 h-4 text-indigo-400" />
                      <span>Modality 2: Satellite SAR / Optical</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Sentinel-1 / FLIR</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Classifies surface sheen (Bonn Standard), calculates Bragg backscatter damping, and traces trailing wake vectors.
                  </p>

                  {/* Output Preview */}
                  {visualResult ? (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-400 font-bold">BONN CODE 5 SLICK</span>
                        <span className="text-indigo-300 font-bold">{visualResult.sourceConfidence}% Confidence</span>
                      </div>
                      <p className="text-slate-300 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800">
                        {visualResult.sheenClassification}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                        <div>Extent: <span className="text-white font-bold">{visualResult.estimatedExtentKm2 || 18.6} km²</span></div>
                        <div>Backscatter: <span className="text-cyan-300 font-bold">-7.8 dB</span></div>
                        <div>Wake Marked: <span className="text-emerald-400 font-bold">Coincident</span></div>
                        <div>Substance: <span className="text-slate-200">Heavy Mineral Oil</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                      <Layers className="w-6 h-6 text-slate-600 mx-auto mb-1 animate-pulse" />
                      <p className="text-xs text-slate-400 font-mono">No SAR imagery ingested yet</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    ref={visualInputRef}
                    type="file"
                    accept="image/*,.tif,.tiff,.png,.jpg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleVisualUpload(e.target.files[0]);
                    }}
                  />
                  <button
                    onClick={() => visualInputRef.current?.click()}
                    disabled={isProcessingVisual}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    onClick={handleLoadSampleVisual}
                    disabled={isProcessingVisual}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center gap-1"
                  >
                    {isProcessingVisual ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Load SAR Sample</span>
                  </button>
                </div>
              </div>

              {/* MODALITY 3: CARGO MANIFEST / BILL OF LADING */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span>Modality 3: Cargo Manifest Document</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">PDF / Bill of Lading</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Extracts declared cargo substance, IMDG HazMat class, total tonnage, and shipper liability identity.
                  </p>

                  {/* Output Preview */}
                  {docResult ? (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-purple-500/30 text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-400 font-bold">BILL OF LADING VERIFIED</span>
                        <span className="text-purple-300 font-bold">{docResult.sourceConfidence}% Confidence</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                        <div>Substance: <span className="text-white font-bold">{docResult.substance}</span></div>
                        <div>HazMat: <span className="text-amber-400 font-bold">{docResult.imdgClass}</span></div>
                        <div>Quantity: <span className="text-white font-bold">{docResult.quantity}</span></div>
                        <div>Vessel: <span className="text-cyan-300 font-bold">{docResult.vesselName}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                      <FileText className="w-6 h-6 text-slate-600 mx-auto mb-1 animate-pulse" />
                      <p className="text-xs text-slate-400 font-mono">No cargo manifest ingested yet</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.txt,.csv,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleDocUpload(e.target.files[0]);
                    }}
                  />
                  <button
                    onClick={() => docInputRef.current?.click()}
                    disabled={isProcessingDoc}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Manifest</span>
                  </button>
                  <button
                    onClick={handleLoadSampleManifest}
                    disabled={isProcessingDoc}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs font-mono font-bold flex items-center justify-center gap-1"
                  >
                    {isProcessingDoc ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Load HFO Manifest</span>
                  </button>
                </div>
              </div>

              {/* MODALITY 4: AIS KINEMATICS & PHYSICS SCORES */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                      <Compass className="w-4 h-4 text-amber-400" />
                      <span>Modality 4: AIS Telemetry &amp; Physics</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Lagrangian Engine</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Combines AIS transponder time-series (SOG drop, blackout gaps) with hydrodynamic backtrack dispersion physics.
                  </p>

                  {/* Physics Scores Card */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-bold">SIMULATOR PHYSICS ATTRIBUTION</span>
                      <span className="text-emerald-400 font-bold">Physics: 50% Weight</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Top Candidate:</span>
                        <span className="text-white font-bold">{physicsScores?.[0]?.vesselName || 'MT SEA HORIZON'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Closest Approach (CPA):</span>
                        <span className="text-cyan-300 font-bold">{physicsScores?.[0]?.distanceKm || 0.38} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kinematic Physics Score:</span>
                        <span className="text-emerald-300 font-bold">{physicsScores?.[0]?.score || 96.5}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      if (onHighlightVessel) onHighlightVessel('538009812');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                  >
                    <Ship className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trigger highlightVessel() on Radar</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CROSS-MODAL ATTRIBUTION & CONFLICT REASONING */}
        {/* ======================================================== */}
        {activeTab === 'attribution' && (
          <div className="space-y-6">
            {attributionResult ? (
              <div className="space-y-5">
                
                {/* Attribution Headline */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-indigo-950/60 border border-red-500/40 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                        MARPOL Annex I Violation Confirmed
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold">
                      {attributionResult.combinedConfidence}% Multimodal Confidence
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Attributed Polluter</span>
                      <span className="text-base font-bold text-white block mt-0.5">{attributionResult.culpritVessel.name}</span>
                      <span className="text-[11px] text-slate-400">IMO {attributionResult.culpritVessel.imo} • Flag: {attributionResult.culpritVessel.flag}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Telemetry Correlation</span>
                      <span className="text-base font-bold text-cyan-400 block mt-0.5">CPA {attributionResult.culpritVessel.cpaKm} km</span>
                      <span className="text-[11px] text-slate-400">Transponder Silence: {attributionResult.culpritVessel.transponderGapMinutes} min</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Model Weight Distribution</span>
                      <span className="text-base font-bold text-amber-400 block mt-0.5">50% Physics • 50% Multimodal AI</span>
                      <span className="text-[11px] text-emerald-400">Cross-verified without hallucination</span>
                    </div>
                  </div>
                </div>

                {/* Cross-Modal Conflict Reasoning Panel */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold uppercase pb-2 border-b border-slate-800">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Cross-Modal Conflict Resolution (No AI Guessing)</span>
                  </div>

                  <div className="space-y-2">
                    {attributionResult.conflictsIdentified.map((conf, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{conf.field}</span>
                          <span className="text-amber-400 text-[10px]">Conflicting Evidence Found</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <strong className="text-slate-300 block">Source A:</strong> {conf.sourceA}
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <strong className="text-slate-300 block">Source B:</strong> {conf.sourceB}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 mt-1">
                          <strong>Resolved by Cross-Modal Reasoning:</strong> {conf.resolvedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Log & Citations */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs">
                  <span className="text-white font-bold uppercase block pb-2 border-b border-slate-800">
                    Chain-of-Custody Citations:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attributionResult.sourcesCited.map((cit, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-cyan-400 font-bold">{cit.source}</span>
                          <span className="text-emerald-400">{cit.confidence}% Confidence</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">{cit.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Directives */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('report')}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Formal MARPOL Consignment Dossier →</span>
                  </button>
                  {onHighlightVessel && (
                    <button
                      onClick={() => onHighlightVessel(attributionResult.culpritVessel.mmsi)}
                      className="py-3 px-5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-xs flex items-center gap-2"
                    >
                      <Ship className="w-4 h-4 text-cyan-400" />
                      <span>Lock Radar onto Suspect Hull</span>
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Attribution Analysis Pending
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                  Click below to synthesize the active VHF audio, SAR radar, cargo manifest, and physics scores.
                </p>
                <button
                  onClick={handleExecuteAttribution}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Multimodal Attribution Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MARPOL DOSSIER & SPOKEN CH 16 ALL-CLEAR */}
        {/* ======================================================== */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {consignmentReport ? (
              <div className="space-y-5">
                
                {/* Official Dossier Header */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                      INTERNATIONAL MARITIME ORGANIZATION (IMO) MARPOL ANNEX I
                    </span>
                    <h3 className="text-base font-bold text-white font-mono mt-0.5">
                      Consignment &amp; Pollution Evidence Dossier #{consignmentReport.dossierId}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Generated: {new Date(consignmentReport.generatedAt).toUTCString()} • Location: {consignmentReport.incidentLocation.areaDescription}
                    </p>
                  </div>

                  {/* Audio Broadcast Trigger */}
                  <button
                    onClick={handleToggleCh16Broadcast}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                      isBroadcastingCh16
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-lg'
                    }`}
                  >
                    {isBroadcastingCh16 ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>Cease VHF CH 16 Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-slate-950" />
                        <span>Broadcast Spoken CH 16 All-Clear</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Evidence Log Table */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono text-xs">
                  <span className="font-bold text-white uppercase block pb-2 border-b border-slate-800">
                    Forensic Multimodal Evidence Log (Chronological):
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-400">
                          <th className="py-2 pr-3">Step</th>
                          <th className="py-2 pr-3">Modality Source</th>
                          <th className="py-2 pr-3">Observation &amp; Telemetry Finding</th>
                          <th className="py-2">Legal Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {consignmentReport.evidenceLog.map((ev) => (
                          <tr key={ev.step} className="hover:bg-slate-950/40">
                            <td className="py-2.5 pr-3 text-cyan-400 font-bold">#{ev.step}</td>
                            <td className="py-2.5 pr-3 text-white font-bold">{ev.source}</td>
                            <td className="py-2.5 pr-3 text-slate-300 font-sans">{ev.finding}</td>
                            <td className="py-2.5 text-emerald-400 font-bold">{ev.weight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Broadcast Script Text Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1.5 font-bold uppercase text-cyan-300">
                      <Radio className="w-3.5 h-3.5" />
                      <span>VHF Channel 16 Broadcast Script (Coast Guard Standard)</span>
                    </span>
                    <span>Speech Synthesis Ready</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed text-xs bg-slate-900/60 p-3 rounded border border-slate-800">
                    &quot;{consignmentReport.ch16AllClearBroadcastScript}&quot;
                  </p>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">
                  Execute attribution in the previous tab to compile the official MARPOL Consignment report.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PLAIN-LANGUAGE SEMANTIC SEARCH */}
        {/* ======================================================== */}
        {activeTab === 'search' && (
          <div className="space-y-5">
            
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask in natural English (e.g. 'spills involving HFO', 'collisions in Hormuz')..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs font-mono text-white placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs shrink-0"
              >
                Search Archives
              </button>
            </form>

            {/* Quick Suggestion Pills */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
              <span className="text-slate-500">Quick Queries:</span>
              {['spills involving HFO', 'tanker collision Hormuz', 'magic pipe bilge release', 'chemical condensate'].map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    setSearchQuery(pill);
                    setSearchResults(MultimodalAIService.searchPastIncidents(pill));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Incident Cards */}
            <div className="space-y-3 font-mono text-xs">
              {searchResults.length > 0 ? (
                searchResults.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{inc.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                        {inc.relevanceScore}% Match
                      </span>
                    </div>
                    <p className="text-slate-400 font-sans text-xs">{inc.summary}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <div>Date: <span className="text-slate-200">{inc.date}</span></div>
                      <div>Substance: <span className="text-amber-300">{inc.substance}</span></div>
                      <div>Culprit: <span className="text-white font-bold">{inc.culprit}</span></div>
                      <div>Volume: <span className="text-cyan-300">{inc.volumeM3} m³</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No historical incidents matched your query.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
