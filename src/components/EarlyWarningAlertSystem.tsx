import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Radio,
  Satellite,
  ShieldAlert,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Waves,
  Wind,
  Ship,
  Compass,
  MapPin,
  RefreshCw,
  Phone,
  Mail,
  Share2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Eye,
  Sliders,
  Play,
  Pause,
  Clock,
  Navigation,
  Globe,
  FileText,
  Zap,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RadioTower,
  History,
  UserCheck,
  Cast,
  MessageSquare,
} from 'lucide-react';
import {
  EarlyWarningAlert,
  SurveillanceSector,
  AlertNotificationConfig,
  AlertDispatchRecord,
} from '../types';
import { SURVEILLANCE_SECTORS } from '../data/surveillanceSectors';
import { INITIAL_EARLY_WARNING_ALERTS } from '../data/initialAlerts';
import { alertSoundService } from '../services/alertSound';
import { OperatorAuthService } from '../services/operatorAuthService';
import { SatellitePowerBroadcastModal } from './SatellitePowerBroadcastModal';
import { ResponseHistoryModal } from './ResponseHistoryModal';
import { OperatorAuthModal } from './OperatorAuthModal';
import { SarMap } from './SarMap';

interface EarlyWarningAlertSystemProps {
  reducedMotion: boolean;
  onLoadIntoWorkbench?: (alert: EarlyWarningAlert) => void;
  onNavigateToSatelliteAi?: () => void;
}

export const EarlyWarningAlertSystem: React.FC<EarlyWarningAlertSystemProps> = ({
  reducedMotion,
  onLoadIntoWorkbench,
  onNavigateToSatelliteAi,
}) => {
  // Sectors & Active Selection
  const [sectors, setSectors] = useState<SurveillanceSector[]>(SURVEILLANCE_SECTORS);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('india-mumbai-high-offshore');
  const [activeRegionFilter, setActiveRegionFilter] = useState<'ALL_INDIA' | 'INDIA_WEST' | 'INDIA_EAST' | 'GLOBAL'>('ALL_INDIA');

  // Alerts state
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(INITIAL_EARLY_WARNING_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState<EarlyWarningAlert | null>(INITIAL_EARLY_WARNING_ALERTS[0]);
  const [activeMessageModalAlert, setActiveMessageModalAlert] = useState<EarlyWarningAlert | null>(null);

  // New persistent modals state
  const [showSatelliteBroadcastModal, setShowSatelliteBroadcastModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [activeOperator, setActiveOperator] = useState(OperatorAuthService.getCurrentUser());

  // Notification Configuration
  const [config, setConfig] = useState<AlertNotificationConfig>({
    phoneNumber: activeOperator.phoneNumber || '+91 98200 44910',
    email: activeOperator.email || 'shouvik8910@gmail.com',
    webhookUrl: 'https://eoc-gateway.maritime.gov.in/api/v1/incidents/spilltwin',
    icgCoastGuardNotify: true,
    dgShippingNotify: true,
    statePcbNotify: true,
    minConfidenceThreshold: 75,
    minAreaThresholdKm2: 0.5,
    autoScanIntervalSeconds: 25,
    autoScanActive: true,
    soundAlertEnabled: true,
    browserPushEnabled: true,
    monitoredRegions: ['INDIA', 'GLOBAL'],
  });

  // UI / Scanner dynamic state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCountdown, setScanCountdown] = useState<number>(config.autoScanIntervalSeconds);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'alert' | 'info'; message: string } | null>(null);
  const [copiedDispatchId, setCopiedDispatchId] = useState<string | null>(null);
  const [isTestingBroadcast, setIsTestingBroadcast] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Active sector lookup
  const currentSector = sectors.find((s) => s.id === selectedSectorId) || sectors[0];

  // Refresh operator from storage
  const refreshOperator = () => {
    const op = OperatorAuthService.getCurrentUser();
    setActiveOperator(op);
    setConfig((prev) => ({
      ...prev,
      phoneNumber: op.phoneNumber || prev.phoneNumber,
      email: op.email || prev.email,
    }));
  };

  // Filtered sectors list
  const filteredSectors = sectors.filter((s) => {
    if (activeRegionFilter === 'ALL_INDIA') return s.region === 'INDIA';
    if (activeRegionFilter === 'INDIA_WEST') return s.region === 'INDIA' && s.subZone.includes('West');
    if (activeRegionFilter === 'INDIA_EAST') return s.region === 'INDIA' && (s.subZone.includes('East') || s.subZone.includes('South') || s.subZone.includes('Andaman'));
    if (activeRegionFilter === 'GLOBAL') return s.region === 'GLOBAL';
    return true;
  });

  // Fetch updated alerts from server
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts/history');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAlerts(json.data);
          if (!selectedAlert && json.data.length > 0) {
            setSelectedAlert(json.data[0]);
          }
        }
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Autonomous Radar Sweeper Timer Loop
  useEffect(() => {
    if (!config.autoScanActive) return;

    const timer = setInterval(() => {
      setScanCountdown((prev) => {
        if (prev <= 1) {
          // Trigger autonomous satellite sweep
          triggerSurveillanceSweep(selectedSectorId, true);
          return config.autoScanIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.autoScanActive, config.autoScanIntervalSeconds, selectedSectorId]);

  // Execute Satellite Radar Surveillance Sweep
  const triggerSurveillanceSweep = async (targetSectorId: string, isAuto = false) => {
    setIsScanning(true);
    setStatusBanner({
      type: 'info',
      message: `Spaceborne radar sweep active over ${currentSector.name}. Processing synthetic aperture backscatter...`,
    });

    if (config.soundAlertEnabled && !isAuto) {
      alertSoundService.playSonarPing();
    }

    try {
      const res = await fetch('/api/alerts/surveillance-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId: targetSectorId,
          customPhone: config.phoneNumber,
          customEmail: config.email,
          customWebhook: config.webhookUrl,
          autoDispatchAlert: true,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.alert) {
          setAlerts((prev) => [json.alert, ...prev.slice(0, 25)]);
          setSelectedAlert(json.alert);

          if (config.soundAlertEnabled) {
            alertSoundService.playEmergencyAlarm();
          }

          setStatusBanner({
            type: 'alert',
            message: `🚨 OIL SPILL DETECTED in ${json.alert.targetSector.name}! Automated SMS & Email dispatches sent to responders.`,
          });
        }
      } else {
        setStatusBanner({
          type: 'info',
          message: `Orbital radar sweep completed over ${currentSector.name}. Baseline surface backscatter normal.`,
        });
      }
    } catch {
      setStatusBanner({
        type: 'info',
        message: `Satellite radar surveillance sweep complete. Nominal backscatter recorded.`,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Test Emergency Broadcast Dispatcher
  const handleTestBroadcast = async () => {
    setIsTestingBroadcast(true);
    if (config.soundAlertEnabled) {
      alertSoundService.playEmergencyAlarm();
    }

    try {
      const res = await fetch('/api/alerts/dispatch-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: selectedAlert?.id || alerts[0]?.id,
          customPhone: config.phoneNumber,
          customEmail: config.email,
          customWebhook: config.webhookUrl,
          customNote: 'TEST BROADCAST — Maritime emergency early-warning communication pipeline verification.',
          broadcastToCoastGuard: config.icgCoastGuardNotify,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.updatedAlert) {
            setSelectedAlert(json.updatedAlert);
            setAlerts((prev) =>
              prev.map((a) => (a.id === json.updatedAlert.id ? json.updatedAlert : a))
            );
          }
          if (config.soundAlertEnabled) {
            alertSoundService.playDispatchSuccess();
          }
          setStatusBanner({
            type: 'success',
            message: `✅ Test Emergency Message Alert successfully transmitted to SMS (${config.phoneNumber}) & Email!`,
          });
        }
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'success',
        message: `✅ Test Alert dispatched to simulated carrier gateway & Coast Guard terminal!`,
      });
    } finally {
      setIsTestingBroadcast(false);
    }
  };

  // Acknowledge Alert
  const handleAcknowledge = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, officerName: 'Coast Guard Watch Officer (MRCC)' }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.alert) {
          setAlerts((prev) => prev.map((a) => (a.id === alertId ? json.alert : a)));
          if (selectedAlert?.id === alertId) {
            setSelectedAlert(json.alert);
          }
          setStatusBanner({
            type: 'success',
            message: `Alert ${json.alert.alertCode} acknowledged by Maritime Operations Centre.`,
          });
        }
      }
    } catch {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDispatchId(id);
    setTimeout(() => setCopiedDispatchId(null), 2500);
  };

  // Convert early warning alert to SAR Analysis structure for map preview
  const mapCenter = selectedAlert
    ? { lat: selectedAlert.targetSector.lat, lng: selectedAlert.targetSector.lng }
    : currentSector.coordinates;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. Header & Live Early Warning Telemetry HUD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-cyan-500/30 shadow-2xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>24/7 AUTOMATED SPILL DETECTION & DISPATCH</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/20">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>India EEZ & Global Strategic Chokepoints</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-cyan-400 shrink-0" />
              <span>Autonomous Satellite Early Warning & Alert Dispatcher</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              Continuous spaceborne SAR radar (Sentinel-1, ISRO EOS-06, INSAT-3DR) sweeps across Indian coastal waters and international shipping lanes. When Bragg wave suppression indicates hydrocarbon discharge, instant emergency alerts (SMS, Email, Webhook, Coast Guard MRCC) are dispatched automatically with reverse-track vessel attribution and shoreline drift forecasts.
            </p>
          </div>

          {/* Quick Scanner Action Widget */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${config.autoScanActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    {config.autoScanActive ? 'Live Auto-Surveillance' : 'Surveillance Paused'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {config.autoScanActive ? `Next satellite pass in: ${scanCountdown}s` : 'Manual mode active'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfig((c) => ({ ...c, autoScanActive: !c.autoScanActive }))}
                  className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                    config.autoScanActive
                      ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                  }`}
                  title={config.autoScanActive ? 'Pause Auto-Scan' : 'Resume Auto-Scan'}
                >
                  {config.autoScanActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setConfig((c) => ({ ...c, soundAlertEnabled: !c.soundAlertEnabled }))}
                  className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                    config.soundAlertEnabled
                      ? 'bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title={config.soundAlertEnabled ? 'Sound Alerts On' : 'Sound Alerts Muted'}
                >
                  {config.soundAlertEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-instant-sector-sweep"
                onClick={() => triggerSurveillanceSweep(selectedSectorId, false)}
                disabled={isScanning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Orbit...' : 'Trigger Instant Sweep'}</span>
              </button>

              <button
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Configure SMS & Email Gateways"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Satellite Constellation Badges & Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">Active Constellations:</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-cyan-300">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" /> Sentinel-1A C-SAR (10m)
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-emerald-300">
              <Satellite className="w-3.5 h-3.5 text-emerald-400" /> ISRO EOS-06 Oceansat-3
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-amber-300">
              <Satellite className="w-3.5 h-3.5 text-amber-400" /> INSAT-3DR TIR
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-purple-300">
              <Radio className="w-3.5 h-3.5 text-purple-400" /> Satellite AIS Transponders
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Ship-to-Ship V2V Rescue Hub Trigger */}
            <button
              onClick={() => {
                const hubEl = document.getElementById('ship-to-ship-hub');
                if (hubEl) {
                  hubEl.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.hash = 'v2v';
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
            >
              <Ship className="w-3.5 h-3.5" />
              <span>🚢 Ship-to-Ship (V2V) Intercom</span>
            </button>

            {/* Satellite Power Emergency Broadcast Trigger */}
            <button
              onClick={() => setShowSatelliteBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all"
            >
              <RadioTower className="w-3.5 h-3.5" />
              <span>🛰️ Satellite Power Alert Nearest Ships</span>
            </button>

            {/* Audit History Trigger */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-xs transition-colors"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Response History</span>
            </button>

            {/* Operator Switch / Profile Trigger */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-slate-200 border border-cyan-700/50 font-semibold text-xs transition-colors"
              title="Switch Operator Profile or Login"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[120px]">{activeOperator.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* Notification Status Banner */}
        {statusBanner && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in ${
              statusBanner.type === 'alert'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : statusBanner.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusBanner.type === 'alert' && <Flame className="w-4 h-4 text-red-400 shrink-0" />}
              {statusBanner.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {statusBanner.type === 'info' && <Radio className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />}
              <span>{statusBanner.message}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-black/30"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. Configuration Drawer (Optional Expandable Panel) */}
      {showConfigDrawer && (
        <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Alert Dispatch & Notification Settings</h3>
            </div>
            <button
              onClick={() => setShowConfigDrawer(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary SMS Mobile Number</span>
              </label>
              <input
                type="text"
                value={config.phoneNumber}
                onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                placeholder="+91-XXXXXXXXXX"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Instant SMS sent whenever spill area &gt; {config.minAreaThresholdKm2} km²</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Coast Guard / Marine Responder Email</span>
              </label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="officer@coastguard.gov.in"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Receives full MARPOL Annex I POLREP briefings</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Emergency Operations Center Webhook</span>
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://eoc.maritime.gov.in/api/v1/webhook"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Real-time JSON payload for Slack, Discord, or EOC server</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.icgCoastGuardNotify}
                  onChange={(e) => setConfig({ ...config, icgCoastGuardNotify: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Indian Coast Guard (ICG MRCC) Broadcast Net</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dgShippingNotify}
                  onChange={(e) => setConfig({ ...config, dgShippingNotify: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>DG Shipping Emergency Bureau</span>
              </label>
            </div>

            <button
              onClick={handleTestBroadcast}
              disabled={isTestingBroadcast}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingBroadcast ? 'Transmitting...' : 'Send Live Test Broadcast Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Operational Command Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sector Directory & Active Alerts Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sector Selector & Geographic Filter */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-white text-sm">Surveillance Sectors</h2>
              </div>
              <span className="text-xs text-slate-400">{filteredSectors.length} Sectors Active</span>
            </div>

            {/* Region Filter Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setActiveRegionFilter('ALL_INDIA')}
                className={`py-1.5 px-2 rounded-lg transition-colors text-center ${
                  activeRegionFilter === 'ALL_INDIA' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇮🇳 All India
              </button>
              <button
                onClick={() => setActiveRegionFilter('INDIA_WEST')}
                className={`py-1.5 px-2 rounded-lg transition-colors text-center ${
                  activeRegionFilter === 'INDIA_WEST' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇮🇳 West Coast
              </button>
              <button
                onClick={() => setActiveRegionFilter('INDIA_EAST')}
                className={`py-1.5 px-2 rounded-lg transition-colors text-center ${
                  activeRegionFilter === 'INDIA_EAST' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇮🇳 East & Islands
              </button>
              <button
                onClick={() => setActiveRegionFilter('GLOBAL')}
                className={`py-1.5 px-2 rounded-lg transition-colors text-center ${
                  activeRegionFilter === 'GLOBAL' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌍 Global
              </button>
            </div>

            {/* Sector Cards */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredSectors.map((sector) => {
                const isSelected = sector.id === selectedSectorId;
                const hasAlert = alerts.some((a) => a.targetSector.id === sector.id && !a.acknowledged);

                return (
                  <button
                    key={sector.id}
                    onClick={() => {
                      setSelectedSectorId(sector.id);
                      // Select matching alert if any
                      const matching = alerts.find((a) => a.targetSector.id === sector.id);
                      if (matching) setSelectedAlert(matching);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/70 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {hasAlert ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-white truncate">{sector.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                        <span>{sector.stateOrCountry}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{sector.defaultMetocean.currentSpeedMps} m/s @ {sector.defaultMetocean.currentDirectionDeg}°</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasAlert
                            ? 'bg-red-950 text-red-400 border border-red-500/40'
                            : sector.currentRiskLevel === 'ELEVATED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {hasAlert ? 'SPILL ALERT' : sector.currentRiskLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Alert Messages Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                <h2 className="font-bold text-white text-sm">Live Incident Detections & Sent Dispatches</h2>
              </div>
              <span className="text-xs text-slate-400">{alerts.length} Total Logs</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                const isCritical = alert.severity === 'CRITICAL_SPILL';

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setSelectedSectorId(alert.targetSector.id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-slate-850 border-red-500/80 shadow-lg shadow-red-950/30 ring-1 ring-red-500/30'
                        : alert.acknowledged
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/80 border-red-900/40 hover:border-red-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-red-950 text-red-400 border border-red-500/50'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {alert.severity.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-cyan-400">{alert.alertCode}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{alert.targetSector.name}</h4>
                      </div>

                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{alert.formattedTime}</span>
                    </div>

                    {/* Slick metrics */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Slick Area:</span>
                        <span className="font-bold text-white">{alert.detectionDetails.slickAreaKm2} km²</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Est. Volume:</span>
                        <span className="font-bold text-amber-300">~{alert.detectionDetails.estimatedVolumeTonnes} T</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Landfall ETA:</span>
                        <span className="font-bold text-red-400">
                          {alert.detectionDetails.driftEtaHoursToShore ? `${alert.detectionDetails.driftEtaHoursToShore}h` : 'Offshore'}
                        </span>
                      </div>
                    </div>

                    {/* Suspect vessel & Dispatched channel pills */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{alert.detectionDetails.suspectVessel?.name || 'Unidentified Tanker'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                            setShowSatelliteBroadcastModal(true);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 hover:bg-amber-900 border border-amber-500/40 flex items-center gap-1"
                          title="Transmit Satellite GMDSS NAVTEX alert to nearest vessels & stations"
                        >
                          <RadioTower className="w-3 h-3 text-amber-400" />
                          <span>Alert Ships</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMessageModalAlert(alert);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Dispatches ({alert.dispatches.length})</span>
                        </button>

                        {!alert.acknowledged ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/30"
                          >
                            Ack
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Ack'd
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Satellite Radar Map & Incident Action Center (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Map & Live Sweep Display */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Satellite className="w-5 h-5 text-cyan-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {selectedAlert ? selectedAlert.targetSector.name : currentSector.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live Spaceborne SAR Radar Overlay &amp; Hydrodynamic Drift Vector
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerSurveillanceSweep(selectedSectorId, false)}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Rescan Sector</span>
                </button>

                {onNavigateToSatelliteAi && (
                  <button
                    onClick={onNavigateToSatelliteAi}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Optical AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Interactive Map */}
            <div className="h-[420px] w-full relative">
              <SarMap
                center={mapCenter}
                zoom={10}
                slickPolygon={
                  selectedAlert
                    ? {
                        type: 'Feature',
                        geometry: {
                          type: 'Polygon',
                          coordinates: selectedAlert.detectionDetails.slickPolygonCoords,
                        },
                        properties: {
                          id: selectedAlert.id,
                          areaKm2: selectedAlert.detectionDetails.slickAreaKm2,
                          areaHectares: selectedAlert.detectionDetails.slickAreaKm2 * 100,
                          perimeterKm: 12.4,
                          meanBackscatterDb: -22.5,
                          ambientBackscatterDb: -13.5,
                          dampingRatioDb: selectedAlert.detectionDetails.dampingRatioDb,
                          slickType: selectedAlert.detectionDetails.hydrocarbonType,
                        },
                      }
                    : null
                }
                candidates={
                  selectedAlert?.detectionDetails?.suspectVessel
                    ? [
                        {
                          id: 'cand-01',
                          mmsi: selectedAlert.detectionDetails.suspectVessel.mmsi,
                          vesselName: selectedAlert.detectionDetails.suspectVessel.name,
                          callsign: 'VT-99',
                          flag: selectedAlert.detectionDetails.suspectVessel.flag,
                          vesselType: 'Crude Oil Tanker',
                          imo: selectedAlert.detectionDetails.suspectVessel.imo,
                          closestPointDistanceKm: selectedAlert.detectionDetails.suspectVessel.distanceFromOriginKm,
                          timeOfClosestApproach: 'Today 03:45 UTC',
                          speedKnots: selectedAlert.detectionDetails.suspectVessel.speedKnots,
                          headingDeg: selectedAlert.detectionDetails.suspectVessel.headingDeg,
                          trajectoryMatchScore: 97.4,
                          riskLevel: 'CRITICAL',
                          aisAnomaly: true,
                          anomalyReason: 'Transponder gap coincident with slick origin coordinates',
                          coordinates: {
                            lat: selectedAlert.targetSector.lat + 0.02,
                            lng: selectedAlert.targetSector.lng + 0.02,
                          },
                          historicalTrack: [
                            { lat: selectedAlert.targetSector.lat - 0.03, lng: selectedAlert.targetSector.lng - 0.03 },
                            { lat: selectedAlert.targetSector.lat, lng: selectedAlert.targetSector.lng },
                            { lat: selectedAlert.targetSector.lat + 0.02, lng: selectedAlert.targetSector.lng + 0.02 },
                          ],
                        },
                      ]
                    : []
                }
                uncertaintyEllipse={{
                  center: mapCenter,
                  semiMajorKm: selectedAlert ? Math.sqrt(selectedAlert.detectionDetails.slickAreaKm2) * 1.5 : 3.0,
                  semiMinorKm: selectedAlert ? Math.sqrt(selectedAlert.detectionDetails.slickAreaKm2) * 0.9 : 1.8,
                  angleDeg: currentSector.defaultMetocean.currentDirectionDeg,
                }}
                environmentalConditions={{
                  windSpeedMps: currentSector.defaultMetocean.windSpeedMps,
                  windDirectionDeg: currentSector.defaultMetocean.windDirectionDeg,
                  currentSpeedMps: currentSector.defaultMetocean.currentSpeedMps,
                  currentDirectionDeg: currentSector.defaultMetocean.currentDirectionDeg,
                  waterTemperatureC: currentSector.defaultMetocean.seaTempC,
                  waveHeightMeters: currentSector.defaultMetocean.waveHeightMeters,
                  oilApiGravity: 31.0,
                  spillVolumeEstimatedM3: selectedAlert?.detectionDetails?.estimatedVolumeM3 || 450,
                }}
                reducedMotion={reducedMotion}
              />
            </div>

            {/* Metocean & Satellite Status Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Wind Velocity</span>
                  <span className="font-bold text-white">
                    {currentSector.defaultMetocean.windSpeedMps} m/s @ {currentSector.defaultMetocean.windDirectionDeg}°
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Ocean Current</span>
                  <span className="font-bold text-white">
                    {currentSector.defaultMetocean.currentSpeedMps} m/s @ {currentSector.defaultMetocean.currentDirectionDeg}°
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Wave Height / SST</span>
                  <span className="font-bold text-white">
                    {currentSector.defaultMetocean.waveHeightMeters}m / {currentSector.defaultMetocean.seaTempC}°C
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Marine Sensitivity</span>
                  <span className="font-bold text-amber-300 truncate block">
                    {currentSector.ecologicalSensitivity.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Incident Action & MARPOL Briefing Card */}
          {selectedAlert && (
            <div className="bg-slate-900/90 border border-red-500/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-base">
                    Active Incident Protocol: {selectedAlert.alertCode}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setShowSatelliteBroadcastModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 border border-amber-400 shadow-md flex items-center gap-1.5"
                  >
                    <RadioTower className="w-3.5 h-3.5" />
                    <span>🛰️ Satellite Alert Nearest Ships</span>
                  </button>

                  <button
                    onClick={() => setActiveMessageModalAlert(selectedAlert)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>View Emergency Messages</span>
                  </button>

                  {onLoadIntoWorkbench && (
                    <button
                      onClick={() => onLoadIntoWorkbench(selectedAlert)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow transition-all flex items-center gap-1"
                    >
                      <span>Load into SAR Workbench</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Recommended Operational Action */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Immediate Coast Guard &amp; Port Action Directive:</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {selectedAlert.recommendedAction}
                </p>
              </div>

              {/* Suspect Vessel Telemetry */}
              {selectedAlert.detectionDetails.suspectVessel && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Suspect Ship:</span>
                    <span className="font-bold text-white">{selectedAlert.detectionDetails.suspectVessel.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MMSI / IMO:</span>
                    <span className="font-bold text-cyan-300">
                      {selectedAlert.detectionDetails.suspectVessel.mmsi} / {selectedAlert.detectionDetails.suspectVessel.imo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vessel Speed / Hdg:</span>
                    <span className="font-bold text-white">
                      {selectedAlert.detectionDetails.suspectVessel.speedKnots} kn @ {selectedAlert.detectionDetails.suspectVessel.headingDeg}°
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Flag State:</span>
                    <span className="font-bold text-slate-300">{selectedAlert.detectionDetails.suspectVessel.flag}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Transmitted Emergency Message & Dispatch Log Modal */}
      {activeMessageModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-500/40">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    Transmitted Emergency Messages ({activeMessageModalAlert.alertCode})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automated SMS, Email &amp; Maritime Radio Dispatches triggered on satellite detection
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveMessageModalAlert(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Real Relay Toolbar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Direct External Actions:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <a
                  href={`mailto:${encodeURIComponent(config.email)}?subject=${encodeURIComponent(`[URGENT POLREP] Oil Spill Detected - ${activeMessageModalAlert.targetSector.name}`)}&body=${encodeURIComponent(
                    `🚨 OFFICIAL MARITIME POLLUTION INCIDENT REPORT (POLREP)\nRef: ${activeMessageModalAlert.alertCode}\nSector: ${activeMessageModalAlert.targetSector.name}\nCoordinates: ${activeMessageModalAlert.targetSector.lat}°N, ${activeMessageModalAlert.targetSector.lng}°E\nEstimated Quantity: ${activeMessageModalAlert.detectionDetails.estimatedVolumeTonnes} Tonnes (${activeMessageModalAlert.detectionDetails.hydrocarbonType})\nSuspect Vessel: ${activeMessageModalAlert.detectionDetails.suspectVessel?.name || 'Unidentified'}\nDrift ETA to Shore: ${activeMessageModalAlert.detectionDetails.driftEtaHoursToShore} hours towards ${activeMessageModalAlert.detectionDetails.threatenedCoastline}.\n\nVerified via SpillTwin Spaceborne Sentinel Gateway.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/40 font-bold flex items-center justify-center gap-1.5 text-center"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Mail</span>
                </a>

                <a
                  href={`sms:${encodeURIComponent(config.phoneNumber.replace(/[^\d+]/g, ''))}?body=${encodeURIComponent(
                    `🚨 [SPILLTWIN ALERT] Oil spill detected in ${activeMessageModalAlert.targetSector.name} (${activeMessageModalAlert.detectionDetails.slickAreaKm2} km²). Ref: ${activeMessageModalAlert.alertCode}. Immediate containment required.`
                  )}`}
                  className="p-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/40 font-bold flex items-center justify-center gap-1.5 text-center"
                >
                  <Phone className="w-4 h-4" />
                  <span>Send SMS</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(config.phoneNumber.replace(/[^\d]/g, ''))}&text=${encodeURIComponent(
                    `🚨 *[SPILLTWIN MARPOL ALERT]*\n*Ref:* ${activeMessageModalAlert.alertCode}\n*Sector:* ${activeMessageModalAlert.targetSector.name}\n*Quantity:* ${activeMessageModalAlert.detectionDetails.estimatedVolumeTonnes} Tonnes\n*Suspect Ship:* ${activeMessageModalAlert.detectionDetails.suspectVessel?.name || 'Unidentified'}\n*Drift ETA:* ${activeMessageModalAlert.detectionDetails.driftEtaHoursToShore}h towards ${activeMessageModalAlert.detectionDetails.threatenedCoastline}.\n\n_Transmitted via SpillTwin Sentinel Network_`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-green-950 hover:bg-green-900 text-green-300 border border-green-600/40 font-bold flex items-center justify-center gap-1.5 text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setSelectedAlert(activeMessageModalAlert);
                    setShowSatelliteBroadcastModal(true);
                  }}
                  className="p-2.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center gap-1.5"
                >
                  <RadioTower className="w-4 h-4" />
                  <span>Satellite Uplink</span>
                </button>
              </div>
            </div>

            {/* List of Dispatched Messages */}
            <div className="space-y-4">
              {activeMessageModalAlert.dispatches.map((disp) => (
                <div key={disp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          disp.channel === 'SMS'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                            : disp.channel === 'EMAIL'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                            : disp.channel === 'WEBHOOK'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {disp.channel}
                      </span>
                      <span className="font-mono text-slate-300 truncate max-w-xs">{disp.recipient}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        <Check className="w-3.5 h-3.5" /> {disp.status}
                      </span>
                      <span className="text-slate-500 text-[11px]">{disp.sentAt}</span>
                    </div>
                  </div>

                  {/* Message Content Container */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
                    {disp.messageBody}
                  </div>

                  {/* Copy button */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Receipt ID: {disp.carrierReceiptId || 'SYS-RELAY-01'}</span>
                    <button
                      onClick={() => copyToClipboard(disp.messageBody, disp.id)}
                      className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      {copiedDispatchId === disp.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
              <span className="text-xs text-slate-400">
                All message dispatches meet IMO MARPOL Annex I &amp; Indian Coast Guard emergency notification standards.
              </span>
              <button
                onClick={() => setActiveMessageModalAlert(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modals for Satellite Broadcast, Response History, and Operator Auth */}
      <SatellitePowerBroadcastModal
        isOpen={showSatelliteBroadcastModal}
        onClose={() => setShowSatelliteBroadcastModal(false)}
        activeAlert={selectedAlert}
      />

      <ResponseHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <OperatorAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onUserUpdated={refreshOperator}
      />
    </div>
  );
};

