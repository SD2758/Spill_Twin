import React, { useState } from 'react';
import {
  Satellite,
  Waves,
  Ship,
  Compass,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      title: 'Spaceborne SAR Ingestion & Speckle Filtering',
      subtitle: 'Active Microwave C-band / X-band Imaging',
      icon: Satellite,
      summary: 'Captures high-resolution microwave backscatter through clouds, darkness, and storm weather.',
      description: `Synthetic Aperture Radar (SAR) satellites (e.g. Copernicus Sentinel-1, RADARSAT-2) transmit pulsed microwave signals (C-band ~5.6 cm wavelength) at oblique incidence angles (20°-45°). Because radar provides its own illumination, it operates 24/7 unhindered by cloud cover, fog, or solar illumination angles. Multi-look intensity data is speckle-filtered using enhanced Lee filters to remove Rayleigh noise while preserving sharp slick boundaries.`,
      metrics: [
        { label: 'Radar Band', value: 'C-band (5.405 GHz)' },
        { label: 'Polarization', value: 'VV / VH cross-pol' },
        { label: 'Swath Width', value: '250 km (IW Mode)' },
      ],
    },
    {
      number: '02',
      title: 'Bragg Resonance Damping & CFAR Segmentation',
      subtitle: 'Marangoni Film Damping Effect',
      icon: Waves,
      summary: 'Distinguishes true hydrocarbon mineral oils from clean water and biogenic lookalikes.',
      description: `Clean sea surface roughness is dominated by short gravity-capillary waves (1-10 cm wavelength), which cause strong Bragg resonance backscattering toward the satellite receiver (appearing bright). Oil films form a viscoelastic monolayer (Marangoni effect) that quenches these micro-ripples, rendering the water surface specular and deflecting microwave energy away. The slick appears as a pronounced dark spot (backscatter drop of -4 to -12 dB). Adaptive Constant False Alarm Rate (CFAR) thresholding isolates the exact geometry.`,
      metrics: [
        { label: 'Damping Ratio', value: '-3.5 dB to -12 dB' },
        { label: 'Wind Window', value: '3.0 to 12.0 m/s' },
        { label: 'Boundary Gradient', value: 'Edge-preserving CFAR' },
      ],
    },
    {
      number: '03',
      title: 'Reverse AIS Trajectory Backtracking & Bayesian Attribution',
      subtitle: 'Finding the Offending Polluter',
      icon: Ship,
      summary: 'Backtracks ocean drift reverse in time to intersect historical AIS vessel tracks.',
      description: `Using hydrodynamic hindcast currents and historical 10m wind vector fields, the slick centroid is traced backwards along its negative drift vector to calculate the exact spatio-temporal origin box (T_spill ± 1.5h). The algorithm queries historical AIS maritime transponder records, cross-references ship speeds, vessel types (Crude Tanker > Chemical > Bulk), Closest Point of Approach (CPA), and flags AIS transponder outages to compute a Bayesian Liability Score.`,
      metrics: [
        { label: 'Origin Precision', value: '< 1.2 km radius' },
        { label: 'Temporal Window', value: '24-72h Hindcast' },
        { label: 'AIS Cross-Match', value: 'MMSI / IMO Registry' },
      ],
    },
    {
      number: '04',
      title: 'Euler-Lagrangian 48h Drift & Uncertainty Ellipse',
      subtitle: 'Predictive Response & Shoreline Hazard',
      icon: Compass,
      summary: 'Simulates hundreds of Lagrangian particles with Stokes drift and Mackay weathering.',
      description: `To coordinate containment booms and skimmers, SpillTwin executes a forward Euler-Lagrangian particle dispersion simulation: V_drift = U_current + 0.03 * W_10 (with Coriolis angle deflection) + U_Stokes. Turbulent horizontal eddy diffusion disperses 40-200 Lagrangian mass points, modeling Mackay evaporative weathering. A 95% confidence uncertainty ellipse models forecast wind variance (±2.5 m/s) and triggers automated shoreline landfall alerts.`,
      metrics: [
        { label: 'Forecast Horizon', value: '24 - 48 Hours' },
        { label: 'Windage Factor', value: '3% with Coriolis' },
        { label: 'Confidence Ellipse', value: '95% Covariance' },
      ],
    },
  ];

  return (
    <section className="py-16 bg-slate-950/60 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-xs font-mono mb-3">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Operational Scientific Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
            How SpillTwin Investigates Marine Slicks
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            From raw radar backscatter pixels downlinked from orbit to legally defensible MARPOL Annex I vessel attribution dossiers.
          </p>
        </div>

        {/* Step Navigation Tabs */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.number}
                onClick={() => setActiveStep(idx)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900/90 border-cyan-400/60 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/30'
                    : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                    PHASE {step.number}
                  </span>
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className={`mt-3 text-sm font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {step.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep-Dive Card */}
        <div className="mt-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30 p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                <span>PHASE {steps[activeStep].number}</span>
                <span>•</span>
                <span className="text-slate-400 uppercase tracking-wider">{steps[activeStep].subtitle}</span>
              </div>
              
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-white font-sans">
                {steps[activeStep].title}
              </h3>
              
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                {steps[activeStep].description}
              </p>

              {/* Metric badges */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800">
                {steps[activeStep].metrics.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-mono">{m.label}</p>
                    <p className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Physics Diagram Box */}
            <div className="lg:col-span-4 rounded-2xl bg-slate-950 border border-cyan-900/40 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-3 border-b border-slate-900">
                  <span>RADAR PHYSICS</span>
                  <span className="text-cyan-400 font-bold">ACTIVE REFLECTION</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
                    <span className="font-semibold text-cyan-300 block">Clean Sea Surface:</span>
                    <span className="text-slate-400">High capillary roughness → Strong Bragg backscatter → Bright Pixels (-12 to -15 dB)</span>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/30">
                    <span className="font-semibold text-amber-300 block">Hydrocarbon Slick:</span>
                    <span className="text-slate-400">Capillary wave dampening → Smooth specular surface → Radar Dark Spot (-20 to -26 dB)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-cyan-400">
                <span>Damping Contrast Deficit</span>
                <span className="font-bold text-white">&Delta;&sigma;&deg; &lt; -3.5 dB</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
