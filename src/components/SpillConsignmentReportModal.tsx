import React, { useState } from 'react';
import {
  FileText,
  Building2,
  Shield,
  Ship,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  Phone,
  Radio,
  Printer,
  Copy,
  Check,
  X,
  ExternalLink,
  Package,
  Truck,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { SpillConsignmentOrder, FairwayTrafficShip } from '../types/shipCoordination';

interface SpillConsignmentReportModalProps {
  consignment: SpillConsignmentOrder | null;
  onClose: () => void;
  onDispatchPickupResponder?: (responderShipId: string) => void;
  availableShips: FairwayTrafficShip[];
  onTriggerAllClearBroadcast?: () => void;
}

export const SpillConsignmentReportModal: React.FC<SpillConsignmentReportModalProps> = ({
  consignment,
  onClose,
  onDispatchPickupResponder,
  availableShips,
  onTriggerAllClearBroadcast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!consignment) return null;

  const handleCopy = () => {
    const reportSummary = `
============================================================
OFFICIAL IMO MARPOL ANNEX I CONSIGNMENT & SALVAGE TRANSFER ORDER
DIRECTORATE GENERAL OF SHIPPING / NOS-DCP EMERGENCY DIRECTIVE
============================================================
Consignment Tracking ID: ${consignment.consignmentId}
Current Status: ${consignment.status}
Chain-of-Custody Token: ${consignment.chainOfCustodyToken}

1. SOURCE VESSEL OF DISCHARGE
- Ship Name: ${consignment.sourceVessel.name}
- MMSI: ${consignment.sourceVessel.mmsi} | Call Sign: ${consignment.sourceVessel.callsign}
- Flag State: ${consignment.sourceVessel.flag}

2. INCIDENT & HAZARD SPECIFICATIONS
- Exact Location: ${consignment.exactCoordinatesFormatted}
- Occurrence Timestamp: ${consignment.occurredTimestampFormatted}
- Spill Volume: ${consignment.spillVolumeTonnes} Metric Tonnes
- Cargo/Fuel Type: Heavy Fuel Oil (HFO / Bunker C) & IMDG Marine Pollutant

3. ASSIGNED RECEIVING COASTAL PORT / OIL STATION
- Receiving Station: ${consignment.nearestStation.name}
- Station Authority: ${consignment.nearestStation.authority}
- Distance from Spill: ${consignment.nearestStation.distanceNm} NM
- VHF Working Channel: VHF CH ${consignment.nearestStation.vhfChannel}
- Emergency Hotline: ${consignment.nearestStation.phoneHotline}

4. DESIGNATED CONSIGNMENT SALVAGE & PICKUP UNIT
- Assigned Responder: ${consignment.assignedPickupResponder.name}
- Unit Type: ${consignment.assignedPickupResponder.type}
- Pickup Status: ${consignment.pickupDetectedAt ? `PICKED UP AT ${consignment.pickupDetectedAt} BY ${consignment.recoveredByVesselName}` : 'EN ROUTE / AWAITING PICKUP'}

5. MARPOL COMPLIANCE
- Reference: ${consignment.marpolReference}
- All Clear Broadcast Status: ${consignment.clearanceBroadcastSent ? 'BROADCAST TO EVERYONE & EVERYWHERE' : 'PENDING SECURED RECOVERY'}
============================================================
Generated via Fairway Autonomous Marine Traffic Safety Engine
    `.trim();

    navigator.clipboard.writeText(reportSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const isClosed = consignment.status === 'CLOSED_ALL_CLEAR' || consignment.status === 'RECOVERED_SECURED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-800/60 shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/50 text-cyan-300">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Official Oil Spill Consignment &amp; Salvage Report
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isClosed
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse'
                  }`}
                >
                  {consignment.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                MARPOL Annex I Resolution MEPC.117(52) • Consignment #{consignment.consignmentId}
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          
          {/* Progress Lifecycle Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="font-mono text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Consignment Salvage &amp; Pickup Lifecycle
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
              
              <div className="p-2.5 rounded-xl border bg-cyan-950/60 border-cyan-500 text-cyan-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. Contact Station</span>
                </div>
                <div className="text-[9px] text-slate-300 truncate">{consignment.nearestStation.name.split(' (')[0]}</div>
                <div className="text-[9px] text-cyan-400 font-sans">VHF {consignment.nearestStation.vhfChannel} Ack</div>
              </div>

              <div className="p-2.5 rounded-xl border bg-blue-950/60 border-blue-500 text-blue-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. Manifest Dispatched</span>
                </div>
                <div className="text-[9px] text-slate-300">#{consignment.consignmentId.slice(-4)}</div>
                <div className="text-[9px] text-blue-400">{consignment.spillVolumeTonnes}T Bunker Fuel</div>
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  consignment.status === 'PICKUP_IN_PROGRESS' || isClosed
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Consignment Pickup</span>
                </div>
                <div className="text-[9px] truncate">
                  {consignment.pickupDetectedAt ? `✓ Picked Up` : `En route: ${consignment.assignedPickupResponder.name.split(' ')[1]}`}
                </div>
                <div className="text-[9px] text-amber-300/80">Auto Proximity Detect</div>
              </div>

              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  isClosed
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isClosed ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>4. Broadcast Everywhere</span>
                </div>
                <div className="text-[9px]">
                  {isClosed ? `✓ ALL CLEAR SENT` : `Awaiting Pickup`}
                </div>
                <div className="text-[9px] text-emerald-400/90">VHF 16 &amp; DSC 70</div>
              </div>

            </div>
          </div>

          {/* Section 1: Incident & Casualty Vessel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            
            {/* Box A: Casualty Ship of Origin */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-cyan-400" />
                  <span>Casualty / Origin Vessel</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                  DISCHARGE SOURCE
                </span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="text-white font-bold text-sm">{consignment.sourceVessel.name}</div>
                <div className="text-slate-400">MMSI: <span className="text-cyan-300">{consignment.sourceVessel.mmsi}</span> | Callsign: <span className="text-cyan-300">{consignment.sourceVessel.callsign}</span></div>
                <div className="text-slate-400">Flag Registry: {consignment.sourceVessel.flag}</div>
              </div>
            </div>

            {/* Box B: Incident Coordinates & Occurrence Time */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Exact Spill Coordinates &amp; Time</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  DMS GPS LOG
                </span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="text-amber-200 font-bold">{consignment.exactCoordinatesFormatted}</div>
                <div className="text-slate-400">Time: <span className="text-slate-200">{consignment.occurredTimestampFormatted}</span></div>
                <div className="text-slate-400">Spill Volume: <strong className="text-red-400">{consignment.spillVolumeTonnes} Metric Tonnes</strong> (HFO)</div>
              </div>
            </div>

          </div>

          {/* Section 2: Contacted Port / Oil Station Information */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-800/50 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Contacted Marine Port / Oil Emergency Station</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                {consignment.nearestStation.distanceNm} NM FROM INCIDENT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Station Facility Name:</span>
                <div className="text-white font-bold text-sm">{consignment.nearestStation.name}</div>
                <div className="text-slate-400 text-[11px]">{consignment.nearestStation.authority}</div>
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">VHF Emergency Channel:</span>
                  <div className="text-cyan-300 font-bold">VHF CH {consignment.nearestStation.vhfChannel} (Direct Link Active)</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">24/7 Operations Hotline:</span>
                  <div className="text-slate-200">{consignment.nearestStation.phoneHotline}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Designated Consignment Pickup Unit */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Designated Consignment Salvage Unit (Who Will Pick Up the Spill)</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                  consignment.pickupDetectedAt
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-amber-950 border-amber-500 text-amber-300'
                }`}
              >
                {consignment.pickupDetectedAt ? '✓ PICKUP DETECTED & COMPLETED' : 'TASKED FOR INTERCEPTION'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-emerald-300 font-bold text-sm">
                  {consignment.assignedPickupResponder.name}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {consignment.assignedPickupResponder.type} • High-Sprint Skimmers &amp; 150T Derrick
                </div>
                {consignment.pickupDetectedAt && (
                  <div className="text-emerald-400 font-bold mt-1 text-[11px]">
                    ✓ Container hoisted on deck at {consignment.pickupDetectedAt} by {consignment.recoveredByVesselName}
                  </div>
                )}
              </div>

              {!consignment.pickupDetectedAt && onDispatchPickupResponder && (
                <button
                  onClick={() => onDispatchPickupResponder(consignment.assignedPickupResponder.id)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Unit for Pickup</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Chain-of-Custody & Official Notes */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-400">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>NOS-DCP Legal Chain-of-Custody Token:</span>
              <span className="text-cyan-300">{consignment.chainOfCustodyToken}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              {consignment.officialNotes}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 flex-wrap font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'Manifest Copied!' : 'Copy Consignment'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors hidden sm:flex"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Manifest</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isClosed ? (
              <button
                onClick={onTriggerAllClearBroadcast}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>View Everywhere Broadcast</span>
              </button>
            ) : onDispatchPickupResponder ? (
              <button
                onClick={() => onDispatchPickupResponder(consignment.assignedPickupResponder.id)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>Command Pickup Unit Now</span>
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-bold"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
