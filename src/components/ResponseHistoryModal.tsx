import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Shield,
  User,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  Radio,
  Send,
  Satellite,
  Phone,
  Mail,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AuditActionLog } from '../types';
import { OperatorAuthService } from '../services/operatorAuthService';

interface ResponseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginModal?: () => void;
}

export const ResponseHistoryModal: React.FC<ResponseHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenLoginModal,
}) => {
  const [logs, setLogs] = useState<AuditActionLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadLogs = () => {
    setIsRefreshing(true);
    const localLogs = OperatorAuthService.getAuditLogs();
    setLogs(localLogs);
    // Fetch latest from backend too
    fetch('/api/audit-history')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.logs && data.logs.length > 0) {
          // Merge unique logs
          const combined = [...localLogs];
          data.logs.forEach((srvLog: AuditActionLog) => {
            if (!combined.some((l) => l.id === srvLog.id)) {
              combined.push(srvLog);
            }
          });
          setLogs(combined);
        }
      })
      .catch(() => {})
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.actionType !== actionFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.operatorName.toLowerCase().includes(q) ||
        log.operatorEmail.toLowerCase().includes(q) ||
        log.operatorOrg.toLowerCase().includes(q) ||
        log.targetIncidentOrSector.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.recipientInfo && log.recipientInfo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SpillTwin-Response-Audit-Log-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp (IST)', 'Operator Name', 'Organization', 'Action Type', 'Incident / Sector', 'Details', 'Recipient Info', 'Carrier Receipt ID'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.istTimestamp}"`,
      `"${l.operatorName}"`,
      `"${l.operatorOrg}"`,
      `"${l.actionType}"`,
      `"${l.targetIncidentOrSector}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${(l.recipientInfo || '').replace(/"/g, '""')}"`,
      `"${l.carrierReceiptId || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `SpillTwin-Audit-Log-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (type: AuditActionLog['actionType']) => {
    switch (type) {
      case 'SATELLITE_NAVTEX_BROADCAST':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">🛰️ Satellite Broadcast</span>;
      case 'SMS_DISPATCH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40">📱 SMS Sent</span>;
      case 'EMAIL_DISPATCH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">✉️ Email Dispatched</span>;
      case 'USER_LOGIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">🔐 Operator Sign-In</span>;
      case 'SECTOR_SWEEP_TRIGGERED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">📡 SAR Radar Sweep</span>;
      case 'ALERT_ACKNOWLEDGED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">✅ Alert Acknowledged</span>;
      case 'RADIO_COMMUNICATION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-500/40">📻 Bridge Radio Transmission</span>;
      case 'SPILL_CONTAINMENT_EXECUTION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">🚢 V2V Spill Containment Action</span>;
      case 'CONTACT_DISPATCH_SUBMITTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">🚨 Urgent Dispatch Filed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">👁️ Alert Viewed</span>;
    }
  };

  const currentUser = OperatorAuthService.getCurrentUser();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg sm:text-xl font-sans flex items-center gap-2">
                <span>Response &amp; Transmission Audit History</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {filteredLogs.length} Records
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Immutable audit trail of all operators, alert views, message transmissions &amp; satellite broadcasts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Operator Banner & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Active Terminal: {currentUser.name} ({currentUser.organization})</span>
              <span className="text-slate-400 text-[11px]">Station ID: {currentUser.stationId} • Email: {currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-semibold"
              >
                Switch Operator / Sign In
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 shrink-0 text-xs">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by operator, incident, phone, email, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Actions &amp; Broadcasts</option>
              <option value="SPILL_CONTAINMENT_EXECUTION">🚢 V2V Joint Containment Actions</option>
              <option value="RADIO_COMMUNICATION">📻 Bridge Radio Transmissions</option>
              <option value="SATELLITE_NAVTEX_BROADCAST">🛰️ Satellite NAVTEX Broadcasts</option>
              <option value="SMS_DISPATCH">📱 SMS Dispatches</option>
              <option value="EMAIL_DISPATCH">✉️ Email Dispatches</option>
              <option value="USER_LOGIN">🔐 Operator Sign-Ins</option>
              <option value="SECTOR_SWEEP_TRIGGERED">📡 Radar Sweeps Triggered</option>
              <option value="ALERT_VIEWED">👁️ Incident Alerts Viewed</option>
              <option value="CONTACT_DISPATCH_SUBMITTED">🚨 Urgent Dispatches Filed</option>
            </select>
          </div>
        </div>

        {/* Logs List Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
              <p className="text-sm">No response logs match your current filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.actionType)}
                      <span className="font-bold text-white text-sm">{log.targetIncidentOrSector}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-2">
                      <span className="text-cyan-300 font-semibold">{log.operatorName}</span>
                      <span>•</span>
                      <span>{log.operatorOrg}</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <span className="block text-slate-300">{log.istTimestamp}</span>
                    {log.carrierReceiptId && (
                      <span className="text-cyan-400 text-[10px]">Ref: {log.carrierReceiptId}</span>
                    )}
                  </div>
                </div>

                <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                  {log.details}
                </p>

                {log.recipientInfo && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5">
                    <span className="font-semibold text-slate-300">Recipient / Channel:</span>
                    <span className="font-mono text-cyan-300 truncate max-w-md">{log.recipientInfo}</span>
                  </div>
                )}

                {log.satellitePowerTelemetry && (
                  <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between gap-2 flex-wrap">
                    <span>📡 Spacecraft: <strong>{log.satellitePowerTelemetry.satellite}</strong></span>
                    <span>Uplink EIRP: <strong>{log.satellitePowerTelemetry.uplinkEirpDbw} dBW</strong></span>
                    <span>Frequency: <strong>{log.satellitePowerTelemetry.frequencyMhz} MHz</strong></span>
                    <span className="text-emerald-400 font-bold">✓ {log.satellitePowerTelemetry.beamStatus}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0 text-xs text-slate-400">
          <span>Compliant with IMO MARPOL Annex I &amp; Indian National Oil Spill Disaster Contingency Plan (NOS-DCP).</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
};
