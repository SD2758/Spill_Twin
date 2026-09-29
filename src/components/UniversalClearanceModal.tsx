import React from 'react';
import {
  CheckCircle2,
  Radio,
  Building2,
  Ship,
  Globe,
  X,
  Share2,
  ShieldCheck,
  MapPin,
  Clock,
  Waves,
} from 'lucide-react';
import { UniversalClearanceBroadcast } from '../types/shipCoordination';

interface UniversalClearanceModalProps {
  clearance: UniversalClearanceBroadcast | null;
  onClose: () => void;
}

export const UniversalClearanceModal: React.FC<UniversalClearanceModalProps> = ({
  clearance,
  onClose,
}) => {
  if (!clearance) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl flex flex-col rounded-3xl bg-slate-900 border border-emerald-500/60 shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">
                  Universal All-Clear Broadcast Confirmation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                  DISPATCHED EVERYWHERE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Broadcast ID: {clearance.broadcastId} • {clearance.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Consignment Picked Up &amp; Fairway 100% Cleared</span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Assisting responder <strong className="text-white">{clearance.recoveringVesselName}</strong> has retrieved the lost container and completed oil slick containment at coordinates <strong className="text-emerald-300">{clearance.clearedSlickCoordinates}</strong>. The oil spill is fully neutralized and the navigational corridor is restored to normal cruising status.
            </p>
          </div>

          {/* Multi-Channel Distribution Checklist */}
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Multi-Channel "Broadcast to Everyone &amp; Everywhere" Verified Deliveries:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              
              {/* Channel 1 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block">VHF CH 16 Global Broadcast</span>
                  <span className="text-[11px] text-emerald-400">✓ Securite Warning Cancelled</span>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Universal voice alert to all vessels in 25 NM line-of-sight range.
                  </p>
                </div>
              </div>

              {/* Channel 2 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block">DSC CH 70 All Stations</span>
                  <span className="text-[11px] text-emerald-400">✓ Digital DSC Acknowledged</span>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Automated priority telegram to all registered MMSI transponders.
                  </p>
                </div>
              </div>

              {/* Channel 3 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Direct Port / Station Telemetry</span>
                  <span className="text-[11px] text-emerald-400">✓ {clearance.nearestStationName.split(' (')[0]}</span>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Consignment #{clearance.consignmentId} official log entry closed.
                  </p>
                </div>
              </div>

              {/* Channel 4 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Ship className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block">V2V Fairway Passing Traffic</span>
                  <span className="text-[11px] text-emerald-400">✓ 4/4 Vessels Resumed Routes</span>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Traffic separation scheme speeds and fairway clearances restored.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Audit Summary Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Closed Incident Manifest:</span>
              <span className="text-cyan-300 font-bold">{clearance.consignmentId}</span>
            </div>
            <div className="flex justify-between">
              <span>Neutralized Spill Volume:</span>
              <span className="text-white font-bold">{clearance.clearedSpillVolumeTonnes} Tonnes HFO</span>
            </div>
            <div className="flex justify-between">
              <span>Executing Salvage Unit:</span>
              <span className="text-emerald-300 font-bold">{clearance.recoveringVesselName}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between font-mono text-xs">
          <span className="text-slate-400">
            Recorded in Port State Control &amp; NOS-DCP Legal Log
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow"
          >
            Acknowledge &amp; Return
          </button>
        </div>

      </div>
    </div>
  );
};
