import React from 'react';
import {
  Building2,
  Phone,
  Radio,
  FileText,
  Shield,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Compass,
  ArrowRight,
  Flame,
  Ship,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  NearbyPortOrOilStation,
  SpillConsignmentOrder,
  FloatingHazardItem,
  FairwayTrafficShip,
  UniversalClearanceBroadcast,
} from '../types/shipCoordination';

interface NearbyPortsAndConsignmentHubProps {
  stations: NearbyPortOrOilStation[];
  activeHazard: FloatingHazardItem | null;
  activeConsignment: SpillConsignmentOrder | null;
  onDirectContactStation: (stationId?: string) => void;
  onOpenConsignmentModal: () => void;
  onDispatchPickupResponder: (responderShipId: string) => void;
  universalClearanceRecord: UniversalClearanceBroadcast | null;
  onOpenClearanceModal: () => void;
}

export const NearbyPortsAndConsignmentHub: React.FC<NearbyPortsAndConsignmentHubProps> = ({
  stations,
  activeHazard,
  activeConsignment,
  onDirectContactStation,
  onOpenConsignmentModal,
  onDispatchPickupResponder,
  universalClearanceRecord,
  onOpenClearanceModal,
}) => {
  // Find nearest station to the active hazard (or first station if no hazard)
  const nearestStation = stations.reduce(
    (min, s) => ((s.distanceNm ?? 999) < (min.distanceNm ?? 999) ? s : min),
    stations[0]
  );

  const isConsignmentActive = !!activeConsignment;
  const isConsignmentClosed =
    activeConsignment?.status === 'CLOSED_ALL_CLEAR' ||
    activeConsignment?.status === 'RECOVERED_SECURED';

  return (
    <div className="rounded-3xl bg-slate-950 border border-cyan-900/40 p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300">
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Nearby Ports &amp; Marine Oil Spill Response Stations
            </h4>
          </div>
          <p className="text-xs text-slate-400">
            Real-time telemetry to coastal marine oil terminals. Directly contact the nearest station to log official MARPOL consignment manifests and dispatch recovery units.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeConsignment && (
            <button
              onClick={onOpenConsignmentModal}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>View Consignment #{activeConsignment.consignmentId.slice(-4)}</span>
            </button>
          )}

          {universalClearanceRecord && (
            <button
              onClick={onOpenClearanceModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Universal All-Clear Log</span>
            </button>
          )}

          <button
            onClick={() => onDirectContactStation(nearestStation?.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg ${
              activeHazard && !isConsignmentClosed
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-orange-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Direct Contact Nearest Station</span>
          </button>
        </div>
      </div>

      {/* Active Consignment Live Status Banner (if active) */}
      {activeConsignment && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isConsignmentClosed
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
              : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border-amber-500/60 text-amber-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white font-sans">
                  {isConsignmentClosed ? '✅ Consignment Recovered & Resolved' : '📦 Emergency Consignment Active'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  {activeConsignment.consignmentId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300">
                  Station: {activeConsignment.nearestStation.name.split(' (')[0]}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {isConsignmentClosed
                  ? `Container picked up and 35T slick neutralized by ${activeConsignment.recoveredByVesselName}. All Clear broadcasted to all channels!`
                  : `Assigned unit ${activeConsignment.assignedPickupResponder.name} is intercepting spill coordinates [${activeConsignment.exactCoordinatesFormatted}] for pickup.`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              {!isConsignmentClosed && (
                <button
                  onClick={() => onDispatchPickupResponder('ship-icgs-samudra')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Pickup Unit</span>
                </button>
              )}
              <button
                onClick={onOpenConsignmentModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Coastal Ports & Marine Oil Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 font-mono text-xs">
        {stations.map((station) => {
          const isNearest = station.id === nearestStation?.id;
          const isTargetOfConsignment = activeConsignment?.nearestStation.id === station.id;

          const typeBadgeColor =
            station.stationType === 'MARINE_OIL_TERMINAL'
              ? 'bg-amber-950 border-amber-600 text-amber-300'
              : station.stationType === 'PORT_HARBOR'
              ? 'bg-blue-950 border-blue-600 text-blue-300'
              : station.stationType === 'COAST_GUARD_BASE'
              ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
              : 'bg-purple-950 border-purple-600 text-purple-300';

          const typeLabel =
            station.stationType === 'MARINE_OIL_TERMINAL'
              ? 'Marine Oil Terminal'
              : station.stationType === 'PORT_HARBOR'
              ? 'Commercial Port Berth'
              : station.stationType === 'COAST_GUARD_BASE'
              ? 'Coast Guard Base'
              : 'Crude Offshore Berth';

          return (
            <div
              key={station.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isTargetOfConsignment
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-xl'
                  : isNearest
                  ? 'bg-slate-900/90 border-amber-500/70 shadow-lg'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${typeBadgeColor}`}>
                    {typeLabel}
                  </span>
                  {isNearest && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-300 font-bold animate-pulse">
                      🚨 NEAREST STATION
                    </span>
                  )}
                </div>

                {/* Station Name & Authority */}
                <div>
                  <h5 className="font-sans font-bold text-white text-sm leading-snug">
                    {station.name}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {station.authority}
                  </p>
                </div>

                {/* Distance & Telemetry Data */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Distance from Spill:</span>
                    <strong className={isNearest ? 'text-amber-300 text-xs' : 'text-slate-200'}>
                      {station.distanceNm} NM ({(station.distanceNm! * 1.852).toFixed(1)} km)
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Bearing:</span>
                    <span className="text-cyan-300">{station.bearingDeg}° True</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">VHF Channel:</span>
                    <span className="text-white font-bold">VHF CH {station.vhfChannel}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Emergency Phone:</span>
                    <span className="text-slate-300 text-[10px]">{station.phoneHotline}</span>
                  </div>
                </div>

                {/* Equipment specs */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {station.skimmerBoatsAvailable} Skimmer Boats
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {station.boomLengthMeters}m Booms
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80">
                {isTargetOfConsignment ? (
                  <button
                    onClick={onOpenConsignmentModal}
                    className="w-full py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Consignment Active (#{activeConsignment.consignmentId.slice(-4)})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onDirectContactStation(station.id)}
                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
                      isNearest
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact &amp; Send Consignment</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
