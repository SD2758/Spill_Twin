import React, { useState, useEffect, useRef } from 'react';
import {
  Ship,
  Radio,
  RadioTower,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Send,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  RefreshCw,
  Waves,
  Anchor,
  Compass,
  Gauge,
  Layers,
  ArrowRight,
  FileCheck,
  Download,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Activity,
  Flame,
} from 'lucide-react';
import {
  ShipCoordinationScenario,
  V2VVessel,
  RadioMessage,
  ResolutionPhase,
  VesselRole,
} from '../types/shipCoordination';
import {
  INITIAL_V2V_SCENARIOS,
  INITIAL_RADIO_MESSAGES,
  shipAudio,
} from '../services/shipIntercomService';
import { OperatorAuthService } from '../services/operatorAuthService';
import { AutonomousPassingFairwaySimulator } from './AutonomousPassingFairwaySimulator';

export const ShipToShipCoordination: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-container-mumbai');
  const [activeScenario, setActiveScenario] = useState<ShipCoordinationScenario>(INITIAL_V2V_SCENARIOS[0]);
  const [radioMessages, setRadioMessages] = useState<RadioMessage[]>(
    INITIAL_RADIO_MESSAGES['scen-container-mumbai'] || []
  );
  
  // Active bridge view
  const [activeVesselId, setActiveVesselId] = useState<string>(activeScenario.casualtyVessel.id);
  const [currentVhfChannel, setCurrentVhfChannel] = useState<number>(16);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customMsgText, setCustomMsgText] = useState<string>('');
  const [isExecutingPhase, setIsExecutingPhase] = useState<number | null>(null);
  const [copiedCert, setCopiedCert] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  // Live dynamic telemetry calculated from phase completions
  const [containmentPct, setContainmentPct] = useState<number>(15);
  const [remainingSpillTonnes, setRemainingSpillTonnes] = useState<number>(activeScenario.initialSpillTonnes);
  const [currentOutflowRate, setCurrentOutflowRate] = useState<number>(12.4);
  const [leakingActive, setLeakingActive] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle switching scenario
  useEffect(() => {
    const scen = INITIAL_V2V_SCENARIOS.find((s) => s.id === selectedScenarioId) || INITIAL_V2V_SCENARIOS[0];
    setActiveScenario(JSON.parse(JSON.stringify(scen)));
    setRadioMessages(INITIAL_RADIO_MESSAGES[scen.id] || []);
    setActiveVesselId(scen.casualtyVessel.id);
    setContainmentPct(scen.casualtyVessel.hullStatus.containmentProgressPct);
    setRemainingSpillTonnes(scen.initialSpillTonnes);
    setCurrentOutflowRate(scen.casualtyVessel.hullStatus.currentOutflowRateM3h);
    setLeakingActive(true);
    setShowCertificateModal(false);
  }, [selectedScenarioId]);

  // Scroll to bottom of radio console
  useEffect(() => {
    if (messagesEndRef.current && !reducedMotion) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [radioMessages, reducedMotion]);

  // Find currently controlled vessel
  const activeControlledVessel =
    activeScenario.casualtyVessel.id === activeVesselId
      ? activeScenario.casualtyVessel
      : activeScenario.nearbyVessels.find((v) => v.id === activeVesselId) || activeScenario.casualtyVessel;

  // Send a VHF radio message
  const handleTransmitRadio = (customText?: string, msgType: RadioMessage['messageType'] = 'TACTICAL_COORDINATION') => {
    const textToSend = customText || customMsgText;
    if (!textToSend.trim()) return;

    if (soundEnabled) {
      shipAudio.playVhfClick();
    }

    const newMessage: RadioMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      senderVesselId: activeControlledVessel.id,
      senderVesselName: activeControlledVessel.name,
      senderRole: activeControlledVessel.role,
      senderRank: `${activeControlledVessel.captainName}`,
      vhfChannel: currentVhfChannel,
      audioFrequencyMhz: currentVhfChannel === 16 ? 156.8 : currentVhfChannel === 6 ? 156.3 : 156.65,
      messageText: textToSend,
      messageType: msgType,
      urgent: msgType === 'DISTRESS_MAYDAY',
    };

    setRadioMessages((prev) => [...prev, newMessage]);
    setCustomMsgText('');

    // Log to audit history
    OperatorAuthService.recordAuditLog({
      actionType: 'RADIO_COMMUNICATION',
      targetIncidentOrSector: `${activeScenario.title} - VHF Ch ${currentVhfChannel}`,
      details: `[V2V Bridge Intercom] ${activeControlledVessel.name} transmitted: "${textToSend.slice(0, 100)}..."`,
      recipientInfo: `All ships monitoring VHF Ch ${currentVhfChannel} in ${activeScenario.locationName}`,
      carrierReceiptId: `VHF-RELAY-${Date.now().toString(36).toUpperCase()}`,
    });

    // Auto responder logic for realistic feedback
    setTimeout(() => {
      generateAutomatedReply(textToSend, activeControlledVessel);
    }, 1200);
  };

  // Generate automated replies from responding vessels
  const generateAutomatedReply = (sentText: string, sender: V2VVessel) => {
    let replySender = activeScenario.nearbyVessels[0] || activeScenario.casualtyVessel;
    let replyText = '';

    if (sender.role === 'CASUALTY') {
      replySender = activeScenario.nearbyVessels.find((v) => v.role === 'COAST_GUARD') || activeScenario.nearbyVessels[0];
      replyText = `Understood ${sender.name}. This is ${replySender.name}. Bridge crew is standing by. We have eye on your slick perimeter on radar. Proceeding with collaborative containment directive.`;
    } else {
      replySender = activeScenario.casualtyVessel;
      replyText = `Thank you ${sender.name}. This is ${replySender.name}. Bridge officer acknowledges. Our crew is aligned on your coordinates and holding position for containment.`;
    }

    if (soundEnabled) {
      shipAudio.playVhfClick();
    }

    const replyMsg: RadioMessage = {
      id: `msg-reply-${Date.now()}`,
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      senderVesselId: replySender.id,
      senderVesselName: replySender.name,
      senderRole: replySender.role,
      senderRank: `${replySender.captainName}`,
      vhfChannel: currentVhfChannel,
      audioFrequencyMhz: currentVhfChannel === 16 ? 156.8 : currentVhfChannel === 6 ? 156.3 : 156.65,
      messageText: replyText,
      messageType: 'TACTICAL_COORDINATION',
      urgent: false,
    };

    setRadioMessages((prev) => [...prev, replyMsg]);
  };

  // Execute a resolution phase
  const handleExecutePhase = async (phase: ResolutionPhase) => {
    if (phase.status === 'COMPLETED' || isExecutingPhase !== null) return;

    setIsExecutingPhase(phase.id);

    if (soundEnabled) {
      shipAudio.playDscAlarm();
    }

    // Step 1: Radio dispatch announcement
    const radioAlertText = `ALL RESCUE UNITS: Commencing [${phase.title}]. Equipment active: ${phase.equipmentRequired}. Units participating: ${phase.requiredVessels.join(', ')}.`;
    handleTransmitRadio(radioAlertText, 'TACTICAL_COORDINATION');

    // Simulate work duration
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update phase status
    const updatedPhases = activeScenario.phases.map((p) => {
      if (p.id === phase.id) {
        return {
          ...p,
          status: 'COMPLETED' as const,
          completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          completedBy: activeControlledVessel.name,
          telemetryLog: `Efficiency rate 98.4%. ${phase.equipmentRequired} engaged successfully.`,
        };
      }
      return p;
    });

    // Calculate new metrics
    const completedPhasesCount = updatedPhases.filter((p) => p.status === 'COMPLETED').length;
    const totalPhases = updatedPhases.length;
    const newProgress = Math.min(100, Math.round((completedPhasesCount / totalPhases) * 100));
    
    // Decrement remaining tonnes and outflow
    const newTonnes = Math.max(0, Math.round(activeScenario.initialSpillTonnes * (1 - newProgress / 100)));
    const newOutflow = phase.id === 1 ? 0 : Math.max(0, (currentOutflowRate * 0.3));

    setContainmentPct(newProgress);
    setRemainingSpillTonnes(newTonnes);
    setCurrentOutflowRate(newOutflow);
    if (phase.id === 1 || newProgress >= 80) {
      setLeakingActive(false);
    }

    setActiveScenario((prev) => ({
      ...prev,
      phases: updatedPhases,
    }));

    // Post-completion radio message
    if (soundEnabled) {
      shipAudio.playVhfClick();
    }

    const completionMsg: RadioMessage = {
      id: `msg-done-${Date.now()}`,
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      senderVesselId: activeScenario.nearbyVessels[0]?.id || activeScenario.casualtyVessel.id,
      senderVesselName: activeScenario.nearbyVessels[0]?.name || activeScenario.casualtyVessel.name,
      senderRole: 'ASSISTING_RESPONDER',
      senderRank: 'Lead Pollution Response Commander',
      vhfChannel: currentVhfChannel,
      audioFrequencyMhz: 156.3,
      messageText: `✓ SUCCESS: ${phase.title} completed. Containment efficiency now at ${newProgress}%. Slick volume reduced to ${newTonnes} tonnes.`,
      messageType: newProgress >= 100 ? 'CLEAN_VERIFICATION' : 'TACTICAL_COORDINATION',
      urgent: false,
    };

    setRadioMessages((prev) => [...prev, completionMsg]);

    // Record in global audit log
    OperatorAuthService.recordAuditLog({
      actionType: 'SPILL_CONTAINMENT_EXECUTION',
      targetIncidentOrSector: `${activeScenario.title} - ${phase.code}`,
      details: `V2V Joint Operation completed: "${phase.title}". Containment reached ${newProgress}%. Outflow rate reduced to ${newOutflow.toFixed(1)} m³/h.`,
      recipientInfo: phase.requiredVessels.join(' & '),
      carrierReceiptId: `OPS-ACT-${Date.now().toString(36).toUpperCase()}`,
    });

    setIsExecutingPhase(null);

    // If 100% complete, show certificate
    if (newProgress >= 100) {
      setTimeout(() => {
        setShowCertificateModal(true);
      }, 1000);
    }
  };

  const certificateContentText = `========================================================================
INTERNATIONAL MARITIME POLLUTION EMERGENCY RESOLUTION CERTIFICATE
IMO MARPOL Annex I & OPRC 1990 Joint Ship-to-Ship Collaborative Operation
========================================================================
Certificate Ref: IMO-V2V-RESOLVE-${Date.now().toString(36).toUpperCase()}
Incident Title: ${activeScenario.title}
Location: ${activeScenario.locationName}
Casualty Ship: ${activeScenario.casualtyVessel.name} (IMO: ${activeScenario.casualtyVessel.imo} | Callsign: ${activeScenario.casualtyVessel.callsign})
Responding Vessels: ${activeScenario.nearbyVessels.map((v) => `${v.name} (${v.callsign})`).join(', ')}

FINAL SITUATION REPORT (POLREP FINAL):
------------------------------------------------------------------------
- Initial Spill Hydrocarbon: ${activeScenario.hydrocarbonType} (${activeScenario.initialSpillTonnes} Tonnes)
- Active Source Leak Status: COMPLETELY ISOLATED & SEALED (0.0 m³/h Outflow)
- Containment Booming: 1200m High-Tensile J-Formation Ocean Boom
- Hydrocarbon Skimming: Oleophilic Brush & Disc Skimmers (100% recovered)
- Ship-to-Ship Transfer: ${activeScenario.casualtyVessel.hullStatus.remainingTonnesAtRisk || 480} Tonnes fuel transferred to sister vessel safely
- Radar Clean Clearance: Sentinel-1 C-SAR Radar Verified 0.0 ppm sheen
- Final Status: 100% CONTAINED & SECURED

AUTHENTICATED BRIDGE SIGNATORIES:
1. ${activeScenario.casualtyVessel.captainName} (Master, ${activeScenario.casualtyVessel.name})
2. ${activeScenario.nearbyVessels[0]?.captainName || 'Commandant'} (Lead Response Commander)
3. National Maritime Rescue Coordination Centre (MRCC)
========================================================================`;

  const handleCopyCertificate = () => {
    navigator.clipboard.writeText(certificateContentText);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  return (
    <section id="ship-to-ship-hub" className="py-12 bg-slate-950 text-slate-100 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-mono">
              <Ship className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Ship-to-Ship (V2V) Bridge Intercom &amp; Containment Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bridge-to-Bridge Rescue &amp; Collaborative Spill Solution
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-3xl">
              Enable container ships, oil tankers, and Coast Guard response vessels to directly contact each other on VHF Channels 16/06, exchange tactical telemetry, deploy joint ocean booms, and solve active oil spills together.
            </p>
          </div>

          {/* Scenario Selector & Sound Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-cyan-800/50 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {INITIAL_V2V_SCENARIOS.map((scen) => (
                <option key={scen.id} value={scen.id}>
                  ⚓ {scen.casualtyVessel.name} ({scen.locationName.split('(')[0].trim()})
                </option>
              ))}
            </select>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-cyan-950/80 border-cyan-700/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'VHF Audio Sound Effects ON' : 'VHF Audio Sound Effects OFF'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline font-mono">{soundEnabled ? 'VHF Audio' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Containment Status HUD Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Status Item 1: Casualty Ship */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Casualty Vessel:</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-extrabold text-white text-base tracking-tight">{activeScenario.casualtyVessel.name}</span>
              </div>
              <span className="text-xs text-amber-400 font-mono block truncate">
                {activeScenario.casualtyVessel.hullStatus.leakSource}
              </span>
            </div>

            {/* Status Item 2: Outflow Rate */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${currentOutflowRate > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                <span>Active Spill Outflow:</span>
              </span>
              <div className="text-lg font-bold font-mono">
                {currentOutflowRate > 0 ? (
                  <span className="text-red-400">{currentOutflowRate.toFixed(1)} m³/hr</span>
                ) : (
                  <span className="text-emerald-400">0.0 m³/hr (SEALED)</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Remaining on Water: <strong className="text-white">{remainingSpillTonnes} Tonnes</strong>
              </span>
            </div>

            {/* Status Item 3: Containment Progress */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Collaborative Containment Progress:</span>
                </span>
                <span className={`font-bold text-sm ${containmentPct >= 100 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                  {containmentPct}% {containmentPct >= 100 ? '(COMPLETED & CERTIFIED)' : 'RESOLVED'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    containmentPct >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : containmentPct >= 50
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${containmentPct}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Phase Progress: {activeScenario.phases.filter((p) => p.status === 'COMPLETED').length} of {activeScenario.phases.length} Phases</span>
                {containmentPct >= 100 && (
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1"
                  >
                    <FileCheck className="w-3 h-3" /> View Clean Sea Certificate
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Autonomous Passing Traffic, Container Loss & Spill Resolution Simulator */}
        <AutonomousPassingFairwaySimulator
          onRadioBroadcast={(msg) => {
            setTimeout(() => {
              setRadioMessages((prev) => [...prev, msg]);
            }, 0);
          }}
          reducedMotion={reducedMotion}
        />

        {/* Main Grid: Left Column (VHF Intercom & Ship Telemetry) + Right Column (5-Stage Joint Containment Matrix) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (5 Cols): Active Vessels & VHF Bridge-to-Bridge Radio Intercom */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Vessel Bridge Controller Switcher */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Active Bridge Perspective:</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                  LIVE AIS V2V
                </span>
              </div>

              <div className="space-y-2">
                {/* Casualty Ship Button */}
                <button
                  onClick={() => setActiveVesselId(activeScenario.casualtyVessel.id)}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-2 ${
                    activeVesselId === activeScenario.casualtyVessel.id
                      ? 'bg-red-950/40 border-red-500/50 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-red-400" />
                      <span className="font-bold text-xs text-white">{activeScenario.casualtyVessel.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-900 text-red-200 font-mono">CASUALTY</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Master: {activeScenario.casualtyVessel.captainName} | Callsign: {activeScenario.casualtyVessel.callsign}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-red-400 font-bold shrink-0">
                    {leakingActive ? 'LEAKING' : 'SEALED'}
                  </span>
                </button>

                {/* Nearby Assisting Ships */}
                {activeScenario.nearbyVessels.map((vessel) => (
                  <button
                    key={vessel.id}
                    onClick={() => setActiveVesselId(vessel.id)}
                    className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-start justify-between gap-2 ${
                      activeVesselId === vessel.id
                        ? 'bg-cyan-950/50 border-cyan-500/50 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-xs text-white">{vessel.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono">
                          {vessel.role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {vessel.captainName} | Dist: <strong className="text-slate-200">{vessel.distanceNmToCasualty} NM</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      {vessel.equipmentOnBoard.boomLengthMeters}m Boom
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical VHF Bridge Radio Console */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
              
              {/* Radio Channel Header & Frequency Display */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">VHF Marine Radio Console</span>
                    <span className="text-[10px] font-mono text-slate-400">Digital Selective Calling (DSC Ch 70 Locked)</span>
                  </div>
                </div>

                {/* Channel Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => {
                      setCurrentVhfChannel(16);
                      if (soundEnabled) shipAudio.playVhfClick();
                    }}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                      currentVhfChannel === 16 ? 'bg-red-700 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ch 16 (Distress)
                  </button>
                  <button
                    onClick={() => {
                      setCurrentVhfChannel(6);
                      if (soundEnabled) shipAudio.playVhfClick();
                    }}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                      currentVhfChannel === 6 ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ch 06 (Tactical)
                  </button>
                  <button
                    onClick={() => {
                      setCurrentVhfChannel(13);
                      if (soundEnabled) shipAudio.playVhfClick();
                    }}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                      currentVhfChannel === 13 ? 'bg-amber-700 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ch 13 (Bridge)
                  </button>
                </div>
              </div>

              {/* Radio Live Message Feed */}
              <div className="h-64 overflow-y-auto rounded-xl bg-slate-950 p-3 space-y-3 font-mono text-xs border border-slate-800/80 scrollbar-thin">
                {radioMessages.map((msg) => {
                  const isCasualty = msg.senderRole === 'CASUALTY';
                  return (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl border space-y-1 transition-all ${
                        msg.urgent
                          ? 'bg-red-950/30 border-red-800/60 text-red-200'
                          : isCasualty
                          ? 'bg-slate-900/90 border-slate-700/80 text-slate-200'
                          : 'bg-cyan-950/30 border-cyan-800/50 text-cyan-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold flex items-center gap-1">
                          <Ship className="w-3 h-3 text-cyan-400" />
                          <strong className="text-white">{msg.senderVesselName}</strong>
                          <span className="text-slate-400">({msg.senderRank})</span>
                        </span>
                        <span className="text-slate-400">{msg.istTime} | VHF {msg.vhfChannel}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-sans text-slate-100">{msg.messageText}</p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Tactical Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">1-Click Tactical Orders:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    onClick={() =>
                      handleTransmitRadio(
                        `URGENT: Requesting all vessels form J-boom barrier on port quarter. Outflow active at ${currentOutflowRate.toFixed(1)} m³/h.`,
                        'BOOM_DEPLOYMENT'
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-left truncate transition-colors"
                  >
                    🚨 Request Boom Cordon
                  </button>
                  <button
                    onClick={() =>
                      handleTransmitRadio(
                        `Instructing assisting tugs to launch 300 m³/hr skimmers directly inside boom apex.`,
                        'SKIMMER_OPS'
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-left truncate transition-colors"
                  >
                    ⚙️ Deploy Disc Skimmers
                  </button>
                  <button
                    onClick={() =>
                      handleTransmitRadio(
                        `Preparing Yokohama fenders. Ready to commence STS emergency lightering of fuel oil.`,
                        'STS_TRANSFER'
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-left truncate transition-colors"
                  >
                    ⛽ Start STS Lightering
                  </button>
                  <button
                    onClick={() =>
                      handleTransmitRadio(
                        `Slick contained. Requesting Copernicus Sentinel-1 C-SAR radar confirmation pass.`,
                        'CLEAN_VERIFICATION'
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-left truncate transition-colors"
                  >
                    🛰️ Request SAR Check
                  </button>
                </div>
              </div>

              {/* Custom Radio Message Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTransmitRadio();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  placeholder={`Speak as ${activeControlledVessel.name.split(' ')[1] || 'Captain'} on VHF Ch ${currentVhfChannel}...`}
                  value={customMsgText}
                  onChange={(e) => setCustomMsgText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  disabled={!customMsgText.trim()}
                  className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center ${
                    customMsgText.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Push to Talk (PTT) Transmit"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>

          {/* Right Column (7 Cols): 5-Stage Joint Collaborative Spill Resolution Matrix */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="rounded-2xl bg-slate-900/90 border border-cyan-900/40 p-6 space-y-5 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <span>Joint Spill Containment Resolution Protocol</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute ship-to-ship tactical steps in real-time to isolate leaks, deploy ocean booms, skim crude, and solve the crisis.
                  </p>
                </div>

                <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  IMO MARPOL OPRC-1990
                </span>
              </div>

              {/* 5 Resolution Steps */}
              <div className="space-y-3.5">
                {activeScenario.phases.map((phase, idx) => {
                  const isCompleted = phase.status === 'COMPLETED';
                  const isCurrentlyExecuting = isExecutingPhase === phase.id;

                  return (
                    <div
                      key={phase.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow'
                          : isCurrentlyExecuting
                          ? 'bg-amber-950/40 border-amber-500/60 shadow-lg'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Step Number & Title */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                                isCompleted
                                  ? 'bg-emerald-500 text-slate-950'
                                  : isCurrentlyExecuting
                                  ? 'bg-amber-400 text-slate-950 animate-bounce'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white font-sans">{phase.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                              +{phase.reductionPercentage}% Containment
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed pl-8 font-sans">
                            {phase.description}
                          </p>

                          <div className="pl-8 pt-1 text-[11px] font-mono text-slate-400 flex items-center gap-3 flex-wrap">
                            <span>Participating: <strong className="text-slate-200">{phase.requiredVessels.join(' & ')}</strong></span>
                            <span>Gear: <strong className="text-cyan-300">{phase.equipmentRequired}</strong></span>
                          </div>

                          {isCompleted && phase.completedAt && (
                            <div className="pl-8 pt-1 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed at {phase.completedAt} by {phase.completedBy}. {phase.telemetryLog}</span>
                            </div>
                          )}
                        </div>

                        {/* Execute Action Button */}
                        <div className="shrink-0 pt-1">
                          {isCompleted ? (
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold text-xs flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>COMPLETED</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleExecutePhase(phase)}
                              disabled={isExecutingPhase !== null}
                              className={`px-4 py-2 rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 ${
                                isExecutingPhase !== null
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950'
                              }`}
                            >
                              {isCurrentlyExecuting ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Executing...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Deploy &amp; Resolve</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resolution Summary Callout */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs font-mono">
                <div>
                  <span className="text-slate-400 block">Current Action Readiness:</span>
                  <span className="text-cyan-300 font-bold">All 3 vessels synchronized on VHF Ch 16/06.</span>
                </div>

                {containmentPct >= 100 ? (
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>View Official IMO Clean Sea Certificate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Execute next available phase
                      const nextPhase = activeScenario.phases.find((p) => p.status === 'PENDING');
                      if (nextPhase) handleExecutePhase(nextPhase);
                    }}
                    disabled={isExecutingPhase !== null}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1.5 shadow transition-all"
                  >
                    <span>Execute Next Resolution Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Official IMO MARPOL Joint Resolution Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-emerald-500/50 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100">
            
            <div className="text-center space-y-2 border-b border-slate-800 pb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white font-sans">
                Official MARPOL Annex I Joint Resolution Certificate
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                IMO OPRC-1990 Maritime Pollution Response Clean Clearance
              </p>
            </div>

            {/* Certificate Monospace Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-64 scrollbar-thin">
              <pre className="whitespace-pre-wrap">{certificateContentText}</pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleCopyCertificate}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedCert ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCert ? 'Copied to Clipboard' : 'Copy Certificate'}</span>
              </button>

              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950 transition-all"
              >
                Close Certificate
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
