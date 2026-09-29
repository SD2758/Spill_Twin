import React from 'react';
import { ShieldCheck, Satellite, Scale, BookOpen, AlertOctagon, CheckCircle2, Globe2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section className="py-16 bg-slate-950/90 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 text-xs font-mono mb-3">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Maritime Earth Observation Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
            About SpillTwin & Satellite SAR Forensics
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Engineered for coast guards, maritime safety agencies (EMSA, NOAA, ITOPF), and environmental ministries 
            to transform spaceborne Synthetic Aperture Radar into court-admissible evidence.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400 mb-5">
                <Satellite className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                Active Microwave SAR Superiority
              </h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Unlike optical satellites that are blinded by clouds, rain, fog, and night, C-band SAR penetrates 
                atmospheric weather systems 24/7. Active phased-array radar measures subtle capillary wave dampening (0.1 mm surface films), 
                delivering accurate detection independent of sunlight.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-cyan-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Copernicus Sentinel-1 &amp; RADARSAT-2 Ready</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-400 mb-5">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                MARPOL Annex I Legal Attribution
              </h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Illegal operational bilge dumping and tank-washing discharges often occur at night. 
                SpillTwin calculates reverse trajectory corridors and cross-references historical AIS telemetry, 
                extracting vessel identity, Closest Point of Approach (CPA), and transponder blackout anomalies for legal enforcement.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-blue-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>IMO MARPOL 73/78 Prosecution Ready</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-5">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                Euler-Lagrangian Drift &amp; Weathering
              </h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Drift physics combines surface current vectors with 3% direct 10-meter windage and Stokes wave drift. 
                Horizontal turbulent eddy diffusion simulates Lagrangian mass dispersion, while Mackay curves estimate oil evaporation, 
                providing response teams with accurate time-to-impact forecasts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>95% Covariance Uncertainty Modeling</span>
            </div>
          </div>

        </div>

        {/* Operational Guidelines Note */}
        <div className="mt-10 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-start gap-4">
          <AlertOctagon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-1">Scientific Integrity &amp; Lookalike Differentiation:</span>
            Low wind speeds (&lt; 3.0 m/s) produce natural calm areas (grease water, biogenic slicks) that mimic radar dark spots. 
            High wind speeds (&gt; 12.0 m/s) submerge oil into the water column, lowering radar contrast. 
            SpillTwin embeds strict atmospheric suitability tests and boundary gradient metrics to prevent false alarms.
          </div>
        </div>

      </div>
    </section>
  );
};
