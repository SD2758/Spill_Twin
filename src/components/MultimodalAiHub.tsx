import React, { useState, useRef } from 'react';
import {
  Brain,
  Radio,
  Satellite,
  FileText,
  Waves,
  Ship,
  Volume2,
  VolumeX,
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  Download,
  Flame,
  Crosshair,
  Compass,
  ArrowRight,
  Send,
  RefreshCw,
  Eye,
  Layers,
  MapPin,
  Mic,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { GeoCoordinate } from '../types';

interface MultimodalAiHubProps {
  reducedMotion: boolean;
  onNavigateToWorkbench?: () => void;
}

export const MultimodalAiHub: React.FC<MultimodalAiHubProps> = ({
  reducedMotion,
  onNavigateToWorkbench,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attribution' | 'audio-triage' | 'ask-radar'>('attribution');

  // ==========================================
  // DEMO A: CROSS-MODAL ATTRIBUTION STATE
  // ==========================================
  const [selectedAttributionPreset, setSelectedAttributionPreset] = useState<string>('hormuz-tanker');
  const [isAnalyzingAttribution, setIsAnalyzingAttribution] = useState<boolean>(false);
  const [attributionResult, setAttributionResult] = useState<any>(null);

  // ==========================================
  // DEMO B: VHF AUDIO TRIAGE STATE
  // ==========================================
  const [selectedAudioPreset, setSelectedAudioPreset] = useState<string>('mayday_starboard_breach');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState<boolean>(false);
  const [audioTriageResult, setAudioTriageResult] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioOscillatorRef = useRef<OscillatorNode | null>(null);

  // ==========================================
  // DEMO C: ASK-THE-RADAR VISUAL QA STATE
  // ==========================================
  const [selectedQaPreset, setSelectedQaPreset] = useState<string>('slick_vs_lookalike');
  const [customQaQuestion, setCustomQaQuestion] = useState<string>('');
  const [isAskingRadar, setIsAskingRadar] = useState<boolean>(false);
  const [qaResult, setQaResult] = useState<any>(null);

  // Synthesize realistic marine VHF radio static & tone
  const togglePlaySimulatedVhfAudio = (presetId: string) => {
    if (isPlayingAudio) {
      if (audioOscillatorRef.current) {
        try {
          audioOscillatorRef.current.stop();
          audioOscillatorRef.current.disconnect();
        } catch {}
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create dual tone marine VHF radio beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(presetId.includes('mayday') ? 880 : 440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(presetId.includes('mayday') ? 1320 : 660, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.8);

      audioOscillatorRef.current = osc;
      setIsPlayingAudio(true);

      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 1900);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // 1. Run Cross-Modal Attribution
  const handleExecuteAttribution = async () => {
    setIsAnalyzingAttribution(true);
    try {
      const response = await fetch('/api/multimodal/cross-modal-attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioPreset: selectedAttributionPreset,
          spillMetrics: {
            areaKm2: 18.6,
            dampingRatioDb: 7.8,
            centroid: { lat: 26.248, lng: 56.182 },
          },
          aisTelemetry: [
            { timestamp: '02:40 UTC', mmsi: '538009812', name: 'MT SEA HORIZON', sog: 14.2, cog: 148, draught: 16.2, gap: 'NONE' },
            { timestamp: '03:15 UTC', mmsi: '538009812', name: 'MT SEA HORIZON', sog: 11.8, cog: 155, draught: 15.9, gap: 'TRANSPONDER SILENCE (42 MIN)' },
            { timestamp: '03:57 UTC', mmsi: '538009812', name: 'MT SEA HORIZON', sog: 13.9, cog: 146, draught: 15.8, gap: 'RE-ACQUIRED (CPA 0.38 KM FROM SLICK)' },
          ],
          manifestData: `Bill of Lading #BL-9924-HFO
Vessel: MT SEA HORIZON (IMO 9248734, Flag: Marshall Islands)
Shipper: Gulf Terminal Logistics | Consignee: Singapore Bunkering Hub
Cargo Manifested: 42,500 Metric Tons Heavy Fuel Oil (HFO 380 cSt, API Gravity 15.4, Sulfur 0.48%)
Hazardous Code: IMDG Class 3, UN 1268, SOPEP Tier-1 Required.`,
          metoceanData: {
            windSpeedMps: 6.4,
            windDirectionDeg: 310,
            currentSpeedMps: 0.38,
            currentDirectionDeg: 145,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setAttributionResult(json.data);
        }
      }
    } catch (err) {
      console.error('Attribution error:', err);
    } finally {
      setIsAnalyzingAttribution(false);
    }
  };

  // 2. Run VHF Audio Triage
  const handleExecuteAudioTriage = async () => {
    setIsAnalyzingAudio(true);
    try {
      const response = await fetch('/api/multimodal/vhf-audio-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioPresetId: selectedAudioPreset,
          currentContext: { fairway: 'Strait of Hormuz Inbound/Outbound TSS', lat: 26.248, lng: 56.182 },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setAudioTriageResult(json.data);
        }
      }
    } catch (err) {
      console.error('Audio triage error:', err);
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  // 3. Run Ask-the-Radar Visual QA
  const handleExecuteAskRadar = async (questionToAsk?: string) => {
    setIsAskingRadar(true);
    const q = questionToAsk || customQaQuestion || 'Is this dark surface anomaly an oil spill or a low-wind shadow lookalike?';
    try {
      const response = await fetch('/api/multimodal/ask-the-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: q,
          telemetry: {
            windSpeedMps: 6.4,
            windDirectionDeg: 310,
            currentSpeedMps: 0.38,
            ambientBackscatterDb: -14.2,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setQaResult(json.data);
        }
      }
    } catch (err) {
      console.error('Ask radar error:', err);
    } finally {
      setIsAskingRadar(false);
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Hackathon Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 text-white flex items-center gap-1.5 shadow-md">
                <Brain className="w-3.5 h-3.5" />
                <span>MULTIMODAL MARITIME AI FUSION</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                Gemini 3.8 Cross-Modal Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ingest, Fuse &amp; Reason Across <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-300">4 Maritime Modalities</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Traditional maritime systems process radar, AIS coordinates, radio voice, and cargo manifests in isolated silos.
              SpillTwin feeds spaceborne SAR radar, time-series vessel kinematics, emergency VHF audio, and legal Bill of Lading documents into a unified Gemini cross-modal reasoning graph.
            </p>
          </div>

          {onNavigateToWorkbench && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={onNavigateToWorkbench}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold border border-cyan-400/40 text-xs font-mono flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950 transition-all"
              >
                <span>Open SAR Workbench Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 4 Modalities Live Synapse Strip */}
        <div className="mt-6 pt-6 border-t border-indigo-900/40 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Modality 1: Vision</span>
              <span className="font-bold text-cyan-300">Sentinel-1 C-SAR</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Modality 2: Telemetry</span>
              <span className="font-bold text-emerald-300">AIS Vessel Kinematics</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400 border border-amber-800">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Modality 3: Audio</span>
              <span className="font-bold text-amber-300">VHF Ch 16 / DSC Voice</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-950 flex items-center justify-center text-purple-400 border border-purple-800">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Modality 4: Document</span>
              <span className="font-bold text-purple-300">Bill of Lading / SOPEP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigator */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('attribution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'attribution'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Cross-Modal Attribution</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audio-triage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'audio-triage'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span>VHF Audio to Live Radar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ask-radar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            activeSubTab === 'ask-radar'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Search className="w-4 h-4 text-cyan-400" />
          <span>Visual QA ("Ask-the-Radar")</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DEMO A: "CHAIN-OF-CUSTODY" CROSS-MODAL ATTRIBUTION */}
      {/* ========================================================================= */}
      {activeSubTab === 'attribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Inputs: 3 Distinct Modalities */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs">1</span>
                    <span>Multi-Sensory Ingestion Streams</span>
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    Live Triangulation
                  </span>
                </div>

                {/* Modality Stream 1: SAR Radar Imagery */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/40 mb-3">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Satellite className="w-3.5 h-3.5" />
                      <span>Modality A: Satellite SAR Radar Scene</span>
                    </span>
                    <span className="text-slate-500 text-[10px]">Sentinel-1B IW GRDH</span>
                  </div>
                  <div className="h-28 rounded-lg overflow-hidden border border-slate-800 relative bg-slate-900 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80 z-10 pointer-events-none" />
                    <img
                      src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"
                      alt="SAR Radar Scene"
                      className="w-full h-full object-cover opacity-60 filter contrast-125 brightness-90"
                    />
                    <div className="absolute z-20 text-center pointer-events-none">
                      <div className="px-2 py-1 rounded bg-black/80 border border-cyan-400/60 text-cyan-300 text-[11px] font-mono">
                        Bragg Damping: -7.8 dB • 18.6 km² Asymmetric Wake
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modality Stream 2: AIS Telemetry Stream */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 mb-3">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Modality B: AIS Transponder Kinematics</span>
                    </span>
                    <span className="text-amber-400 text-[10px] font-bold">42-Min Blackout Gap</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Target: <strong className="text-white">MT SEA HORIZON</strong> (MMSI 538009812)</span>
                      <span>SOG: 14.2 kn → 11.8 kn</span>
                    </div>
                    <div className="text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-900/50">
                      ⚠️ AIS Anomaly: Transponder silent from 03:15 UTC to 03:57 UTC directly across backtracked spill origin coordinates.
                    </div>
                  </div>
                </div>

                {/* Modality Stream 3: Scanned Cargo Manifest Document */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/40 mb-4">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Modality C: Scanned Bill of Lading Manifest</span>
                    </span>
                    <span className="text-purple-400 text-[10px]">IMDG Class 3</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 space-y-1 border border-purple-950">
                    <p className="font-bold text-slate-100">B/L Ref: #BL-9924-HFO (Ras Tanura → Singapore)</p>
                    <p className="text-slate-400">Cargo: <strong className="text-purple-300">42,500 MT Heavy Fuel Oil (HFO 380 cSt)</strong></p>
                    <p className="text-[10px] text-slate-500">API Density: 15.4 • Viscosity matches SAR capillary wave damping threshold.</p>
                  </div>
                </div>

                {/* Execution Button */}
                <button
                  onClick={handleExecuteAttribution}
                  disabled={isAnalyzingAttribution}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-950 transition-all disabled:opacity-50"
                >
                  {isAnalyzingAttribution ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Gemini 3.8 Cross-Modal Triangulation...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Trigger Gemini Multimodal Cross-Modal Reasoning →</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Output: Cross-Modal Chain of Custody & Verdict */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center text-xs">2</span>
                    <span>Cross-Modal Attribution Verdict</span>
                  </h3>
                  {attributionResult && (
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                      {attributionResult.multimodalAttributionConfidence}% Confidence
                    </span>
                  )}
                </div>

                {!attributionResult && !isAnalyzingAttribution && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <Brain className="w-12 h-12 text-slate-700 mb-3" />
                    <p className="text-xs font-mono text-slate-400 max-w-sm">
                      Click the button on the left to initiate the multimodal reasoning pipeline. Gemini will cross-examine the SAR visual imagery, AIS kinematic trajectory, and cargo manifest simultaneously.
                    </p>
                  </div>
                )}

                {isAnalyzingAttribution && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-mono text-cyan-300 font-bold mb-1">
                      Fusing Modalities: Vision ↔ Telemetry ↔ Document ↔ Metocean
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Correlating Bragg -7.8 dB suppression with HFO 380 cSt and 42-min AIS transponder blackout...
                    </p>
                  </div>
                )}

                {attributionResult && (
                  <div className="space-y-4">
                    
                    {/* Culprit Highlight Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 to-slate-950 border border-red-500/40 text-xs font-mono">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span>CULPRIT IDENTIFIED WITH LEGAL CERTAINTY</span>
                        </span>
                        <span className="text-white font-bold bg-red-900/60 px-2 py-0.5 rounded border border-red-500/50">
                          {attributionResult.culpritVessel?.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-2 border-t border-red-900/40">
                        <div>MMSI: <strong className="text-white">{attributionResult.culpritVessel?.mmsi}</strong></div>
                        <div>IMO: <strong className="text-white">{attributionResult.culpritVessel?.imo}</strong></div>
                        <div>Flag: <strong className="text-white">{attributionResult.culpritVessel?.flag}</strong></div>
                        <div>CPA: <strong className="text-white">{attributionResult.culpritVessel?.cpaKm} km</strong></div>
                      </div>
                    </div>

                    {/* 4-Step Cross-Modal Chain of Evidence */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 font-mono mb-2">
                        Cross-Modal Chain of Custody (Triangulation Proof):
                      </h4>
                      <div className="space-y-2 text-[11px] font-mono">
                        {attributionResult.crossModalChainOfEvidence?.map((item: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-cyan-300 block mb-0.5">{item.modality}</strong>
                              <span className="text-slate-300">{item.evidence}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MARPOL Legal Indictment */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/40 text-[11px] font-mono text-slate-300">
                      <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" />
                        <span>Statutory MARPOL Annex I Indictment:</span>
                      </div>
                      <p className="text-slate-400 mb-2">{attributionResult.marpolViolationClause}</p>
                      <div className="bg-slate-900 p-2 rounded text-[10px] text-slate-400 leading-relaxed max-h-36 overflow-y-auto">
                        {attributionResult.forensicDossierMarkdown}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEMO B: MARINE VHF RADIO AUDIO TO LIVE TACTICAL RADAR */}
      {/* ========================================================================= */}
      {activeSubTab === 'audio-triage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Radio Ingestion & Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span>VHF Radio Channel 16 Broadcasts</span>
                  </h3>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    Acoustic Modality
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mb-4">
                  Select a live or simulated marine distress broadcast. Gemini's acoustic &amp; speech model parses voice stress, extracts distress level, and extracts spoken GPS coordinates.
                </p>

                {/* Audio Presets */}
                <div className="space-y-2 mb-4 font-mono text-xs">
                  <label
                    onClick={() => setSelectedAudioPreset('mayday_starboard_breach')}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAudioPreset === 'mayday_starboard_breach'
                        ? 'border-red-500 bg-red-950/30 text-white'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" /> MAYDAY: MT Ocean Sovereign
                      </span>
                      <span className="text-[10px] text-slate-500">CH 16 / 156.8 MHz</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      "Starboard bunker tank punctured, heavy crude leaking at 26°26.2N 056°19.5E"
                    </p>
                  </label>

                  <label
                    onClick={() => setSelectedAudioPreset('panpan_fairway_collision')}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAudioPreset === 'panpan_fairway_collision'
                        ? 'border-amber-500 bg-amber-950/30 text-white'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> PAN-PAN: Pacific Pioneer
                      </span>
                      <span className="text-[10px] text-slate-500">CH 16 Urgent</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      "Struck submerged fairway buoy, light fuel sheen astern, steering disabled"
                    </p>
                  </label>

                  <label
                    onClick={() => setSelectedAudioPreset('sea_horizon_manifold')}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAudioPreset === 'sea_horizon_manifold'
                        ? 'border-red-500 bg-red-950/30 text-white'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" /> MAYDAY: MT Sea Horizon
                      </span>
                      <span className="text-[10px] text-slate-500">CH 16 Distress</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      "Ruptured bunker fuel line overflowing into sea at 26°24.8N 056°18.2E"
                    </p>
                  </label>
                </div>

                {/* Simulated Audio Player Control */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlaySimulatedVhfAudio(selectedAudioPreset)}
                      className={`p-2 rounded-lg transition-colors ${
                        isPlayingAudio
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={isPlayingAudio ? 'Stop audio' : 'Play marine radio tone & chatter'}
                    >
                      {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-200 block">
                        {isPlayingAudio ? 'Broadcasting on 156.800 MHz...' : 'Preview VHF Waveform'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {isPlayingAudio ? 'Acoustic voice stress detected' : 'Click to hear VHF radio call'}
                      </span>
                    </div>
                  </div>

                  {isPlayingAudio && (
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-3 bg-amber-400 animate-pulse"></span>
                      <span className="w-1 h-5 bg-amber-400 animate-pulse delay-75"></span>
                      <span className="w-1 h-2 bg-amber-400 animate-pulse delay-150"></span>
                    </div>
                  )}
                </div>

                {/* Execute Triage Button */}
                <button
                  onClick={handleExecuteAudioTriage}
                  disabled={isAnalyzingAudio}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-950 transition-all disabled:opacity-50"
                >
                  {isAnalyzingAudio ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transcribing &amp; Extracting Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Parse VHF Audio &amp; Plot on Live Radar →</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Tactical Radar Pinning & Spoken Telemetry */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span>Tactical Radar Auto-Pinning &amp; Exclusion Perimeter</span>
                  </h3>
                  {audioTriageResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40 font-bold animate-pulse">
                      CH70 DSC Active
                    </span>
                  )}
                </div>

                {!audioTriageResult && !isAnalyzingAudio && (
                  <div className="h-72 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <Volume2 className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-xs font-mono text-slate-400">
                      Select a radio broadcast and click "Parse VHF Audio". Gemini will extract coordinates and pin the distress marker directly onto the live radar grid.
                    </p>
                  </div>
                )}

                {isAnalyzingAudio && (
                  <div className="h-72 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-mono text-amber-300 font-bold mb-1">
                      Gemini Acoustic Model Ingesting Waveform...
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Decoupling maritime noise, calculating stress index, and converting spoken minutes to decimal WGS84 coordinates.
                    </p>
                  </div>
                )}

                {audioTriageResult && (
                  <div className="space-y-4">
                    
                    {/* Transcript Card */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/40 text-xs font-mono">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4" /> Spoken Radio Transcript (CH 16):
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                          {audioTriageResult.urgency} • {audioTriageResult.stressRating}
                        </span>
                      </div>
                      <blockquote className="italic text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border-l-2 border-amber-400 text-[11px] leading-relaxed">
                        "{audioTriageResult.transcript}"
                      </blockquote>
                    </div>

                    {/* Extracted Telemetry HUD */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Extracted Lat</span>
                        <span className="font-bold text-cyan-300">{audioTriageResult.extractedCoordinates?.lat?.toFixed(4)}°N</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Extracted Lng</span>
                        <span className="font-bold text-cyan-300">{audioTriageResult.extractedCoordinates?.lng?.toFixed(4)}°E</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Vessel Callsign</span>
                        <span className="font-bold text-white">{audioTriageResult.callsign}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Exclusion Zone</span>
                        <span className="font-bold text-red-400">{audioTriageResult.recommendedExclusionRadiusKm} km</span>
                      </div>
                    </div>

                    {/* Tactical Simulated Radar Visual Canvas */}
                    <div className="relative h-44 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-3 font-mono text-[11px]">
                      {/* Grid background */}
                      <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                      
                      <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-2">
                        <span>RADAR CANVAS OVERLAY: EXTRACTED VOICE COORDINATES</span>
                        <span className="text-emerald-400">REAL-TIME PINNED</span>
                      </div>

                      <div className="relative h-28 flex items-center justify-center">
                        {/* Dynamic Exclusion Perimeter Circle */}
                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-red-500/80 bg-red-950/20 animate-pulse flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-lg shadow-red-500" />
                        </div>

                        {/* Callsign Tag */}
                        <div className="absolute top-2 right-4 bg-slate-900/90 border border-red-500 px-2 py-1 rounded text-[10px] text-white">
                          🚨 <strong>{audioTriageResult.vesselName}</strong>
                          <div className="text-slate-400 text-[9px]">{audioTriageResult.extractedCoordinates?.lat}°N, {audioTriageResult.extractedCoordinates?.lng}°E</div>
                        </div>
                      </div>
                    </div>

                    {/* ITU-R M.493 DSC Formatted Broadcast */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-slate-300 block mb-1">ITU-R M.493 DSC Distress Relay Output:</span>
                      <code>{audioTriageResult.dscAlertFormatted}</code>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEMO C: DRONE & SATELLITE "ASK-THE-RADAR" VISUAL QA */}
      {/* ========================================================================= */}
      {activeSubTab === 'ask-radar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Visual Crop + Telemetry Context */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-400" />
                    <span>Visual-Telemetric Cross-Examination</span>
                  </h3>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    Dual Modality QA
                  </span>
                </div>

                {/* Radar Image Crop Preview */}
                <div className="relative h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"
                    alt="Radar Target Crop"
                    className="w-full h-full object-cover filter contrast-150 brightness-75"
                  />
                  <div className="absolute inset-0 border-2 border-cyan-400/80 rounded-xl pointer-events-none" />
                  <div className="absolute bottom-2 left-2 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300 border border-cyan-800">
                    Target: Dark Dampened Anomaly near Outbound Fairway
                  </div>
                </div>

                {/* Live Metocean Sensor Stream Context */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block mb-1.5 font-bold">CROSS-CORRELATED SENSOR TELEMETRY:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-400 block text-[10px]">Anemometer Wind</span>
                      <strong className="text-cyan-300">6.4 m/s</strong> @ 310° NW
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-400 block text-[10px]">ADCP Current</span>
                      <strong className="text-emerald-300">0.38 m/s</strong> @ 145°
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-400 block text-[10px]">Radar Damping</span>
                      <strong className="text-rose-400">-7.8 dB</strong> Suppression
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-400 block text-[10px]">Wave Buoy</span>
                      <strong className="text-amber-300">1.1 m</strong> Wave Height
                    </div>
                  </div>
                </div>

                {/* Quick Preset Prompts */}
                <div className="space-y-1.5 mb-4 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 block font-bold">SAMPLE OPERATOR INQUIRIES:</span>
                  <button
                    onClick={() => {
                      setCustomQaQuestion('Is this dark surface anomaly an authentic hydrocarbon spill, a low-wind shadow lookalike, or biogenic algal grease? Correlate with wind speed.');
                      handleExecuteAskRadar('Is this dark surface anomaly an authentic hydrocarbon spill, a low-wind shadow lookalike, or biogenic algal grease? Correlate with wind speed.');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors"
                  >
                    1. "Is this an oil spill or a low-wind shadow? Correlate with wind speed."
                  </button>
                  <button
                    onClick={() => {
                      setCustomQaQuestion('Evaluate the boundary gradient of this slick against active wave height (1.1m) to determine hydrocarbon viscosity.');
                      handleExecuteAskRadar('Evaluate the boundary gradient of this slick against active wave height (1.1m) to determine hydrocarbon viscosity.');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors"
                  >
                    2. "Evaluate boundary gradient vs wave height for viscosity."
                  </button>
                </div>

                {/* Custom Question Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQaQuestion}
                    onChange={(e) => setCustomQaQuestion(e.target.value)}
                    placeholder="Ask Gemini to visually & telemetrically inspect..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleExecuteAskRadar();
                    }}
                  />
                  <button
                    onClick={() => handleExecuteAskRadar()}
                    disabled={isAskingRadar}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Oceanographic AI Reasoning Verdict */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 h-full flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span>Gemini Visual-Telemetric Oceanographic Verdict</span>
                  </h3>
                  {qaResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
                      {qaResult.confidenceScore}% Certainty
                    </span>
                  )}
                </div>

                {!qaResult && !isAskingRadar && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <Search className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-xs font-mono text-slate-400 max-w-sm">
                      Select or type a question to inspect the radar imagery. Gemini will cross-examine pixel edge gradients with the live 6.4 m/s wind sensor.
                    </p>
                  </div>
                )}

                {isAskingRadar && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-mono text-purple-300 font-bold mb-1">
                      Evaluating Bragg Resonance &amp; Viscoelastic Dampening...
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Cross-referencing radar dark patch contrast with anemometer speed (6.4 m/s).
                    </p>
                  </div>
                )}

                {qaResult && (
                  <div className="space-y-4 font-mono text-xs">
                    
                    {/* Verdict Card */}
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-purple-300 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>DETECTION VERDICT:</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40 text-[11px]">
                          {qaResult.verdict}
                        </span>
                      </div>
                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        {qaResult.answer}
                      </p>
                    </div>

                    {/* Scientific Corroboration Blocks */}
                    <div className="space-y-2 text-[11px]">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-cyan-300 block mb-1">1. Bragg Wave Resonant Physics:</strong>
                        <p className="text-slate-300 leading-relaxed">{qaResult.braggResonanceAnalysis}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-amber-300 block mb-1">2. Metocean Wind-Lookalike Elimination:</strong>
                        <p className="text-slate-300 leading-relaxed">{qaResult.metoceanCorroboration}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <strong className="text-emerald-300 block mb-1">3. Tactical Operational Directive:</strong>
                        <p className="text-slate-300 leading-relaxed">{qaResult.recommendedAction}</p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
