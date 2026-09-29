import React, { useState } from 'react';
import { Shield, User, Building, Mail, Phone, Key, LogIn, CheckCircle2, UserCheck, RefreshCw, X } from 'lucide-react';
import { OperatorProfile } from '../types';
import { OperatorAuthService, PRESET_OPERATORS } from '../services/operatorAuthService';

interface OperatorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (operator: OperatorProfile) => void;
}

export const OperatorAuthModal: React.FC<OperatorAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeOperator, setActiveOperator] = useState<OperatorProfile>(OperatorAuthService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  const [customForm, setCustomForm] = useState({
    name: '',
    organization: '',
    stationId: '',
    email: '',
    phoneNumber: '',
    role: 'Watchstander / Duty Officer' as OperatorProfile['role'],
    badgeNumber: '',
  });
  const [showSuccessNotice, setShowSuccessNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: OperatorProfile) => {
    const loggedIn = OperatorAuthService.loginUser(preset);
    setActiveOperator(loggedIn);
    setShowSuccessNotice(true);
    setTimeout(() => {
      setShowSuccessNotice(false);
      if (onLoginSuccess) onLoginSuccess(loggedIn);
      onClose();
    }, 1200);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: OperatorProfile = {
      id: `custom-op-${Date.now()}`,
      name: customForm.name,
      organization: customForm.organization || 'Maritime Emergency Response',
      stationId: customForm.stationId || 'CUSTOM-STATION-01',
      email: customForm.email,
      phoneNumber: customForm.phoneNumber || '+91 98000 00000',
      role: customForm.role,
      badgeNumber: customForm.badgeNumber || `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
      loginTimestamp: new Date().toISOString(),
      isCustomGuest: true,
    };

    const loggedIn = OperatorAuthService.loginUser(newProfile);
    setActiveOperator(loggedIn);
    setShowSuccessNotice(true);
    setTimeout(() => {
      setShowSuccessNotice(false);
      if (onLoginSuccess) onLoginSuccess(loggedIn);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg sm:text-xl font-sans">
                Maritime Command &amp; Operator Access
              </h3>
              <p className="text-xs text-slate-400">
                Authenticate your terminal to record audit logs, dispatch live alerts &amp; broadcast satellite NAVTEX
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast overlay */}
        {showSuccessNotice && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 flex items-center gap-3 animate-fade-in text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Terminal Authenticated! Logged in as {activeOperator.name} ({activeOperator.organization}). Audit trail active.</span>
          </div>
        )}

        {/* Current Active User Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {activeOperator.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{activeOperator.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {activeOperator.role}
                </span>
              </div>
              <p className="text-slate-400 text-xs">{activeOperator.organization} • Station: <strong className="text-slate-200">{activeOperator.stationId}</strong></p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            <span className="text-emerald-400 font-bold block flex items-center gap-1 justify-end">
              <UserCheck className="w-3.5 h-3.5" /> Logged In
            </span>
            <span>{activeOperator.email}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`flex-1 py-2 rounded-lg transition-colors text-center ${
              activeTab === 'PRESETS' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Official Agency Profiles (ICG / INCOIS / DG Shipping)
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`flex-1 py-2 rounded-lg transition-colors text-center ${
              activeTab === 'CUSTOM' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Officer / Responder Sign In
          </button>
        </div>

        {/* 1. Official Agency Presets List */}
        {activeTab === 'PRESETS' && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400">
              Select an official maritime agency station to switch credentials or re-login:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_OPERATORS.map((op) => {
                const isSelected = activeOperator.id === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => handleSelectPreset(op)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{op.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-semibold">{op.organization}</div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span>{op.stationId}</span>
                      <span className="text-slate-300 font-mono text-[10px]">{op.phoneNumber}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Custom Login Form */}
        {activeTab === 'CUSTOM' && (
          <form onSubmit={handleCustomSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Officer / User Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commander Vikram Rathore"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Agency / Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Coast Guard / Port Authority"
                  value={customForm.organization}
                  onChange={(e) => setCustomForm({ ...customForm, organization: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. shouvik8910@gmail.com"
                  value={customForm.email}
                  onChange={(e) => setCustomForm({ ...customForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile / Alert Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98200 XXXXX"
                  value={customForm.phoneNumber}
                  onChange={(e) => setCustomForm({ ...customForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operational Role</label>
                <select
                  value={customForm.role}
                  onChange={(e) => setCustomForm({ ...customForm, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Chief Incident Commander">Chief Incident Commander</option>
                  <option value="Watchstander / Duty Officer">Watchstander / Duty Officer</option>
                  <option value="Satellite SAR Specialist">Satellite SAR Specialist</option>
                  <option value="Environmental Response Coordinator">Environmental Response Coordinator</option>
                  <option value="Port Controller">Port Controller</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Station / Terminal Code</label>
                <input
                  type="text"
                  placeholder="e.g. MRCC-VIZAG-01"
                  value={customForm.stationId}
                  onChange={(e) => setCustomForm({ ...customForm, stationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In &amp; Save Terminal Profile</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Session credentials &amp; response history persist in your local terminal.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
