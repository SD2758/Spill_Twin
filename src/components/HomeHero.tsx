import React from 'react';
import {
  Satellite,
  Waves,
  ArrowRight,
  Target,
  Ship,
  Sparkles,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Radio,
  FileText,
  Compass,
} from 'lucide-react';
import { SAMPLE_SAR_SCENES } from '../data/sampleScenes';
import { INITIAL_EARLY_WARNING_ALERTS } from '../data/initialAlerts';

interface HomeHeroProps {
  onStartDemo: (sampleId?: string) => void;
  onStartAlerts?: () => void;
  onStartV2v?: () => void;
  onStartSatelliteAi?: () => void;
  onStartTimeMachine?: () => void;
  onStartMultimodalAi?: () => void;
  onExploreHowItWorks: () => void;
  reducedMotion: boolean;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onStartDemo,
  onStartAlerts,
  onStartV2v,
  onStartSatelliteAi,
  onStartTimeMachine,
  onStartMultimodalAi,
  onExploreHowItWorks,
  reducedMotion,
}) => {
  const activeScene = SAMPLE_SAR_SCENES[0];
  const activeAlerts = INITIAL_EARLY_WARNING_ALERTS.slice(0, 3);

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* 1. Header Zone: Clean Mission Statement */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Copernicus Sentinel-1 SAR &amp; Real-Time AIS Fusion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Autonomous Satellite SAR <br className="hidden sm:inline" />
            <span className="text-cyan-400">Oil Spill Intelligence</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Detect anomalous dark slicks, correlate transponder blackout gaps, and compute hydrodynamic drift 
            trajectories for legally defensible maritime incident attribution under IMO MARPOL Annex I.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onStartDemo()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <Target className="w-4 h-4" />
            <span>Open Investigation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {onStartMultimodalAi && (
            <button
              onClick={onStartMultimodalAi}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multimodal AI Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Level 1: Current Investigation Status Bar */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Investigation
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              SP-2026-001
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Acquisition: Sentinel-1B C-Band SAR
          </span>
        </div>

        {/* Scannable Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block font-mono">Incident Status</span>
            <span className="text-sm font-semibold text-cyan-300 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Under Investigation
            </span>
            <span className="text-[10px] text-slate-400">Verified target</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-mono">Severity &amp; Footprint</span>
            <span className="text-sm font-bold text-rose-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              High (18.6 km²)
            </span>
            <span className="text-[10px] text-slate-400">BAOAC Code 5 Emulsion</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-mono">Coordinates &amp; Zone</span>
            <span className="text-sm font-semibold text-white block mt-0.5">
              26.34°N, 56.28°E
            </span>
            <span className="text-[10px] text-slate-400">Strait of Hormuz TSS</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-mono">Attribution Confidence</span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5 font-mono">
              94.2% Certainty
            </span>
            <span className="text-[10px] text-slate-400">-7.8 dB Bragg suppression</span>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center lg:justify-end">
            <button
              onClick={() => onStartDemo(activeScene.id)}
              className="w-full lg:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Analyze Scene</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Investigation Workflow Stepper */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white font-mono">01 DETECT</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">SAR backscatter damping mapped</p>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Complete</span>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-bold text-cyan-300 font-mono">02 VERIFY</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">Bragg wave suppression check</p>
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Active Phase</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 font-mono">03 ATTRIBUTE</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">AIS trajectory &amp; blackout gap</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">In Progress</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 font-mono">04 RESPOND</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">MARPOL filing &amp; VHF broadcast</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">Ready</span>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Level 2: Scannable Key Evidence Grid (3 Columns) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white font-sans">
            Forensic Evidence Summary
          </h2>
          <button
            onClick={() => onStartDemo()}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            View Full Forensic Workbench →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Evidence 1: Radar Backscatter */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Radar Backscatter Suppression</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Verified
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mean Damping Ratio:</span>
                  <span className="text-white font-bold">-7.8 dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Suppressed Slices:</span>
                  <span className="text-slate-200">18.6 km² (major 7.2 km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lookalike Probability:</span>
                  <span className="text-emerald-400">2.2% (Low wind false positive rejected)</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
              Clear capillary wave damping confirmed across C-band VV polarization.
            </p>
          </div>

          {/* Evidence 2: Vessel AIS Correlation */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">AIS Transponder Correlation</span>
                </div>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/40">
                  Anomaly Flag
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Offending Candidate:</span>
                  <span className="text-white font-bold">MT FALCON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MMSI / Flag:</span>
                  <span className="text-slate-200">211832000 (Liberia)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AIS Outage / Gap:</span>
                  <span className="text-amber-300 font-semibold">38 min blackout near slick head</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
              Vessel SOG decreased by 3.2 knots inside the fairway corridor during discharge.
            </p>
          </div>

          {/* Evidence 3: Hydrodynamic Drift */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-white">Lagrangian Drift Forecast</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  48-Hour Model
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Surface Current:</span>
                  <span className="text-white font-bold">1.2 kn @ 142°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">10m Wind Drift:</span>
                  <span className="text-slate-200">6.4 m/s NW (3% Stokes drift)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shoreline Impact Risk:</span>
                  <span className="text-rose-400 font-semibold">Musandam Headland (22h ETA)</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
              Drift trajectory calculated using Eulerian-Lagrangian particle dispersion.
            </p>
          </div>

        </div>
      </div>

      {/* 5. Pre-Calibrated SAR Test Datasets */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">
              Authentic Satellite SAR Test Scenes
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a pre-calibrated Copernicus Sentinel-1 acquisition to instantly load into the forensic workbench.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">10m Spatial Resolution</span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_SAR_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onStartDemo(scene.id)}
              className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {scene.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 shrink-0">
                  {scene.initialResult.metrics.areaKm2} km²
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{scene.region}</p>
              <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">{scene.satellite}</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  Launch →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Live Alert Feed Preview */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">
              24/7 Automated Maritime Alert Stream
            </h3>
          </div>
          {onStartAlerts && (
            <button
              onClick={onStartAlerts}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View All 12 Active Alerts →
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          {activeAlerts.map((alert) => {
            const isCritical = alert.severity === 'HIGH_ALERT';
            return (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{alert.alertCode || alert.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${isCritical ? 'bg-rose-950 text-rose-300 border border-rose-800/50' : 'bg-amber-950 text-amber-300 border border-amber-800/50'}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[11px] text-slate-400">{alert.targetSector?.region}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.targetSector?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <div className="text-left sm:text-right font-mono text-[11px]">
                    <span className="text-slate-400 block">{alert.detectionDetails?.slickAreaKm2} km²</span>
                    <span className="text-emerald-400 font-semibold">{alert.detectionDetails?.confidenceScore}% Conf.</span>
                  </div>
                  <button
                    onClick={() => onStartDemo()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
