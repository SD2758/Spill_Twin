import React from 'react';
import { Radio, Satellite, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center text-slate-950">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <span className="text-white font-bold text-sm tracking-wider">SPILLTWIN SAR</span>
            </div>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              Spaceborne Synthetic Aperture Radar intelligence for maritime oil slick detection, 
              Euler-Lagrangian drift simulation, and MARPOL Annex I vessel attribution.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-3 uppercase tracking-wider text-[11px]">SAR Spacecraft Ingest</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Copernicus Sentinel-1A / 1B (C-Band)</li>
              <li>• RADARSAT Constellation (RCM)</li>
              <li>• TerraSAR-X &amp; PAZ (X-Band)</li>
              <li>• ALOS-2 PALSAR-2 (L-Band)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-3 uppercase tracking-wider text-[11px]">Hydrodynamics &amp; Drift</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• 3% Direct 10m Windage Factor</li>
              <li>• Stokes Wave Drift &amp; Coriolis Deflection</li>
              <li>• Mackay Weathering Evaporation Curves</li>
              <li>• 95% Covariance Uncertainty Ellipses</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-3 uppercase tracking-wider text-[11px]">Legal Standards</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>• IMO MARPOL 73/78 Annex I</li>
              <li>• CleanSeaNet EMSA Standard</li>
              <li>• OPRC 1990 Contingency Protocols</li>
              <li>• WGS84 Geodesic Projection</li>
            </ul>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>SpillTwin Maritime Investigation Engine v2.4</span>
          </div>

          <div className="text-slate-400 text-center sm:text-right">
            Satellite imagery is not real-time video. Latest available satellite imagery shown.
          </div>
        </div>

      </div>
    </footer>
  );
};
