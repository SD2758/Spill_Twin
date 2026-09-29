import React, { useState, useRef, useEffect } from 'react';
import { Radio, Satellite, Activity, ChevronDown, ShieldAlert, Sparkles, Ship, History, HelpCircle, Info, PhoneCall, Menu, X, ArrowRight, Target } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reducedMotion,
  setReducedMotion,
  backendOnline,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation items (clean, professional SaaS structure)
  const primaryNavItems = [
    { id: 'home', label: 'Overview' },
    { id: 'demo', label: 'Investigation' },
    { id: 'multimodal-ai', label: 'Live Intelligence' },
    { id: 'alerts', label: 'Alerts' },
  ];

  // Secondary items in the "More" popover
  const secondaryNavItems = [
    { id: 'satellite-ai', label: 'Satellite AI Scanner', desc: 'Spaceborne SAR pass analysis', icon: Satellite },
    { id: 'v2v', label: 'V2V Rescue & Containment', desc: 'Ship-to-ship coordination', icon: Ship },
    { id: 'time-machine', label: 'Historical Incident Archive', desc: 'Case precedents & forensic library', icon: History },
    { id: 'how-it-works', label: 'Methodology & Physics', desc: 'Bragg wave damping algorithms', icon: HelpCircle },
    { id: 'about', label: 'About SAR Technology', desc: 'Copernicus Sentinel-1 integration', icon: Info },
    { id: 'contact', label: 'Emergency Operations (EOC)', desc: 'Direct coastal authority dispatch', icon: PhoneCall },
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => item.id === activeTab);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('home');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 text-left group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-lg p-1"
            aria-label="SpillTwin Home"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md group-hover:border-cyan-500/50 transition-colors">
              <Radio className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${backendOnline ? 'bg-cyan-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${backendOnline ? 'bg-cyan-500' : 'bg-amber-500'}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white font-mono">
                  SPILL<span className="text-cyan-400">TWIN</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded">
                  SAR v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Maritime Digital Twin &amp; Spill Attribution
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Primary Clean Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {primaryNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* "More" Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isSecondaryActive || isMoreOpen
                  ? 'text-cyan-300 bg-slate-900 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Additional Maritime Modules
                  </span>
                </div>
                <div className="space-y-1">
                  {secondaryNavItems.map((item) => {
                    const isItemActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors ${
                          isItemActive
                            ? 'bg-cyan-950/60 border border-cyan-500/30 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg mt-0.5 ${isItemActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isItemActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Controls & Primary Action */}
        <div className="flex items-center gap-2.5">
          {/* Motion Toggle */}
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            title={reducedMotion ? 'Enable UI Animations' : 'Reduce UI Animations'}
            aria-pressed={reducedMotion}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              reducedMotion
                ? 'bg-amber-950/50 border-amber-600/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span className="text-[11px] font-medium">{reducedMotion ? 'Reduced' : 'Smooth'}</span>
          </button>

          {/* Primary Action Button */}
          <button
            id="launch-sar-demo-btn"
            onClick={() => {
              setActiveTab('demo');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950/50 transition-all active:scale-95"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Open Investigation</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Core Modules
            </span>
            <div className="grid grid-cols-2 gap-2">
              {primaryNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Extended Modules
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {secondaryNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-cyan-950/60 text-cyan-300'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
