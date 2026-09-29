/**
 * SpillTwin - Satellite SAR Investigation Application
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { HowItWorks } from './components/HowItWorks';
import { AboutSection } from './components/AboutSection';
import { LiveDemo } from './components/LiveDemo';
import { LiveSatelliteAI } from './components/LiveSatelliteAI';
import { HistoricalTimeMachine } from './components/HistoricalTimeMachine';
import { EarlyWarningAlertSystem } from './components/EarlyWarningAlertSystem';
import { ShipToShipCoordination } from './components/ShipToShipCoordination';
import { MultimodalAiHub } from './components/MultimodalAiHub';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { HistoricalSpillData, EarlyWarningAlert } from './types';
import { convertAlertToHistoricalSpillData } from './utils/alertConverter';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedDemoSceneId, setSelectedDemoSceneId] = useState<string | null>('persian-gulf-tanker-01');
  const [selectedHistoricalData, setSelectedHistoricalData] = useState<HistoricalSpillData | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // Health check on backend
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartDemo = (sampleId?: string) => {
    if (sampleId) {
      setSelectedDemoSceneId(sampleId);
    }
    setSelectedHistoricalData(null);
    setActiveTab('demo');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleStartAlerts = () => {
    setActiveTab('alerts');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleStartSatelliteAi = () => {
    setActiveTab('satellite-ai');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleStartTimeMachine = () => {
    setActiveTab('time-machine');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleExploreHowItWorks = () => {
    setActiveTab('how-it-works');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleLoadAlertIntoWorkbench = (alert: EarlyWarningAlert) => {
    const historicalData = convertAlertToHistoricalSpillData(alert);
    setSelectedHistoricalData(historicalData);
    setActiveTab('demo');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        }}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        backendOnline={backendOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeHero
            onStartDemo={handleStartDemo}
            onStartMultimodalAi={() => {
              setActiveTab('multimodal-ai');
              window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            }}
            onStartAlerts={handleStartAlerts}
            onStartV2v={() => {
              setActiveTab('v2v');
              window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            }}
            onStartSatelliteAi={handleStartSatelliteAi}
            onStartTimeMachine={handleStartTimeMachine}
            onExploreHowItWorks={handleExploreHowItWorks}
            reducedMotion={reducedMotion}
          />
        )}

        {activeTab === 'multimodal-ai' && (
          <div className="py-6">
            <MultimodalAiHub
              reducedMotion={reducedMotion}
              onNavigateToWorkbench={() => handleStartDemo()}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="py-6">
            <EarlyWarningAlertSystem
              reducedMotion={reducedMotion}
              onLoadIntoWorkbench={handleLoadAlertIntoWorkbench}
              onNavigateToSatelliteAi={handleStartSatelliteAi}
            />
          </div>
        )}

        {activeTab === 'v2v' && (
          <div className="py-6">
            <ShipToShipCoordination reducedMotion={reducedMotion} />
          </div>
        )}

        {activeTab === 'time-machine' && (
          <div className="py-6">
            <HistoricalTimeMachine
              reducedMotion={reducedMotion}
              onLoadIntoWorkbench={(hist) => {
                setSelectedHistoricalData(hist);
                setActiveTab('demo');
                window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
              }}
              onNavigateToSatelliteAi={() => {
                setActiveTab('satellite-ai');
                window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
              }}
            />
          </div>
        )}

        {activeTab === 'satellite-ai' && (
          <div className="py-6">
            <LiveSatelliteAI
              reducedMotion={reducedMotion}
              onNavigateToWorkbench={() => handleStartDemo()}
            />
          </div>
        )}

        {activeTab === 'demo' && (
          <LiveDemo
            initialSceneId={selectedDemoSceneId}
            initialHistoricalData={selectedHistoricalData}
            reducedMotion={reducedMotion}
          />
        )}

        {activeTab === 'how-it-works' && (
          <div className="py-6">
            <HowItWorks />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center pb-12">
              <button
                onClick={() => handleStartDemo()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-sm text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-950 transition-all"
              >
                Test SAR Processing in Live Demo →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="py-6">
            <AboutSection />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="py-6">
            <ContactSection />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
      
    </div>
  );
}

