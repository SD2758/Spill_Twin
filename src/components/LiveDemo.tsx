import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Satellite,
  Waves,
  Ship,
  Compass,
  AlertTriangle,
  FileCheck2,
  Download,
  Play,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  Flame,
  Globe2,
  Calendar,
  Layers,
  FileText,
  Printer,
  ChevronRight,
  RefreshCw,
  Brain,
  Mic,
  Radio,
  X,
} from 'lucide-react';
import { SAMPLE_SAR_SCENES } from '../data/sampleScenes';
import { SarAnalysisResult, EnvironmentalConditions, SuspectCandidate, HistoricalSpillData } from '../types';
import { SarMap } from './SarMap';
import { VisualizationMode, HeatmapColorScale } from './D3SpillHeatmap';
import { MultimodalIntakePanel } from './MultimodalIntakePanel';
import { PhysicsScore } from '../types/multimodal';

interface LiveDemoProps {
  initialSceneId?: string | null;
  initialHistoricalData?: HistoricalSpillData | null;
  reducedMotion: boolean;
}

export const LiveDemo: React.FC<LiveDemoProps> = ({
  initialSceneId,
  initialHistoricalData,
  reducedMotion,
}) => {
  // Current active scene and analysis results
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    initialHistoricalData ? 'historical-custom' : initialSceneId || 'persian-gulf-tanker-01'
  );
  const [analysisResult, setAnalysisResult] = useState<SarAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisStepProgress, setAnalysisStepProgress] = useState<string>('');
  const [analysisProgressPercent, setAnalysisProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Interactive Drift & Simulation state
  const [activeTimestep, setActiveTimestep] = useState<number>(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSimulatingDrift, setIsSimulatingDrift] = useState<boolean>(false);

  // Environmental sliders
  const [envWindSpeed, setEnvWindSpeed] = useState<number>(6.4);
  const [envWindDir, setEnvWindDir] = useState<number>(310);
  const [envCurrentSpeed, setEnvCurrentSpeed] = useState<number>(0.38);
  const [envCurrentDir, setEnvCurrentDir] = useState<number>(145);
  const [envSpillVolume, setEnvSpillVolume] = useState<number>(420);

  // Gemini AI Narrative state
  const [aiReportNarrative, setAiReportNarrative] = useState<string | null>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState<boolean>(false);

  // Active view subtab in results
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'candidates' | 'drift' | 'report' | 'multimodal'>('overview');
  const [workbenchMultimodalResult, setWorkbenchMultimodalResult] = useState<any>(null);
  const [isProcessingWorkbenchMultimodal, setIsProcessingWorkbenchMultimodal] = useState<boolean>(false);

  // D3 Heatmap vs Raw SAR visualization mode
  const [mapVisualizationMode, setMapVisualizationMode] = useState<VisualizationMode>('heatmap');
  const [heatmapColorScale, setHeatmapColorScale] = useState<HeatmapColorScale>('bonn');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);

  // Multimodal AI Banner & Modal State
  const [multimodalAlertBanner, setMultimodalAlertBanner] = useState<string | null>(null);
  const [isMultimodalModalOpen, setIsMultimodalModalOpen] = useState<boolean>(false);

  // Hook 1: spawnSpillAt(coords, details)
  const spawnSpillAt = (coords: { lat: number; lng: number }, details?: any) => {
    if (analysisResult) {
      setAnalysisResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            centre: coords,
          },
          sourceEstimation: {
            ...prev.sourceEstimation,
            backtrackedOrigin: coords,
            estimatedSpillTime: details?.vesselName
              ? `VHF Emergency Call: ${details.vesselName}`
              : 'Confirmed via VHF Radio CH 16 Emergency Distress',
          },
        };
      });
    }
    setMultimodalAlertBanner(
      `🎙️ VHF Audio Distress Point Acquired: [${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E] – Spill position pinned on tactical radar.`
    );
    setTimeout(() => setMultimodalAlertBanner(null), 10000);
  };

  // Hook 2: highlightVessel(mmsiOrId)
  const highlightVessel = (mmsiOrId: string) => {
    if (!analysisResult?.candidates) return;
    const match = analysisResult.candidates.find(
      (c) =>
        c.mmsi === mmsiOrId ||
        c.id === mmsiOrId ||
        c.vesselName.toLowerCase().includes(mmsiOrId.toLowerCase())
    );
    if (match) {
      setSelectedCandidateId(match.id);
      setActiveViewTab('candidates');
      setMultimodalAlertBanner(
        `🎯 Radar Track Locked onto Attributed Polluter: ${match.vesselName} (MMSI ${match.mmsi})`
      );
      setTimeout(() => setMultimodalAlertBanner(null), 10000);
    }
  };

  // Map candidates to PhysicsScore[] for the multimodal fusion engine
  const mappedPhysicsScores: PhysicsScore[] = React.useMemo(() => {
    if (!analysisResult?.candidates) return [];
    return analysisResult.candidates.map((c) => ({
      mmsi: c.mmsi,
      vesselName: c.vesselName,
      score: c.trajectoryMatchScore,
      distanceKm: c.closestPointDistanceKm,
      timeMatchScore: c.riskLevel === 'CRITICAL' ? 98 : c.riskLevel === 'HIGH' ? 85 : 40,
      driftAlignmentScore: Math.round(c.trajectoryMatchScore * 0.95),
      backscatterMatch: Math.round(c.trajectoryMatchScore * 0.98),
      rationale: c.anomalyReason || `CPA ${c.closestPointDistanceKm} km coinciding with transponder gap.`,
    }));
  }, [analysisResult?.candidates]);

  // Load historical data if passed
  useEffect(() => {
    if (initialHistoricalData) {
      loadHistoricalScenario(initialHistoricalData);
    } else if (selectedSceneId && selectedSceneId !== 'historical-custom') {
      loadPrecalibratedScene(selectedSceneId);
    }
  }, [initialHistoricalData, selectedSceneId]);

  const loadHistoricalScenario = (hist: HistoricalSpillData) => {
    setEnvWindSpeed(hist.metocean.windSpeedMps);
    setEnvWindDir(hist.metocean.windDirectionDeg);
    setEnvCurrentSpeed(hist.metocean.waterCurrentSpeedMps);
    setEnvCurrentDir(hist.metocean.waterCurrentDirectionDeg);
    setEnvSpillVolume(hist.spillVolume.amountM3);

    const mapVesselType = (t: string): 'Crude Oil Tanker' | 'Chemical Tanker' | 'Bulk Carrier' | 'Container Ship' | 'Cargo' | 'Offshore Platform' => {
      const lower = t.toLowerCase();
      if (lower.includes('chemical')) return 'Chemical Tanker';
      if (lower.includes('tanker')) return 'Crude Oil Tanker';
      if (lower.includes('bulk')) return 'Bulk Carrier';
      if (lower.includes('container')) return 'Container Ship';
      if (lower.includes('platform') || lower.includes('rig')) return 'Offshore Platform';
      return 'Cargo';
    };

    const mapSlickType = (t: string): 'Heavy Crude' | 'Refined Fuel' | 'Bunker Fuel' | 'Biogenic Lookalike' => {
      const lower = t.toLowerCase();
      if (lower.includes('refined') || lower.includes('diesel') || lower.includes('condensate')) return 'Refined Fuel';
      if (lower.includes('bunker') || lower.includes('fuel oil')) return 'Bunker Fuel';
      if (lower.includes('biogenic') || lower.includes('algae') || lower.includes('lookalike')) return 'Biogenic Lookalike';
      return 'Heavy Crude';
    };

    const sensorBand = (hist.satelliteSensor.band === 'X-band' ? 'X-band' : hist.satelliteSensor.band === 'L-band' ? 'L-band' : 'C-band') as 'C-band' | 'X-band' | 'L-band';
    const polarization = (hist.satelliteSensor.polarization === 'VH' || hist.satelliteSensor.polarization === 'HH' || hist.satelliteSensor.polarization === 'HV' || hist.satelliteSensor.polarization === 'VV+VH' ? hist.satelliteSensor.polarization : 'VV') as 'VV' | 'VH' | 'HH' | 'HV' | 'VV+VH';
    const orbitPass = (hist.satelliteSensor.passType === 'Ascending' ? 'Ascending' : 'Descending') as 'Ascending' | 'Descending';

    const parsedCandidates: SuspectCandidate[] = hist.vessels.map((v, i) => {
      const angle = ((i * 90 + 30) * Math.PI) / 180;
      const distDeg = (v.distanceFromSpillKm || 0.5) / 111.0;
      const isCulprit = v.role.toLowerCase().includes('culprit') || v.role.toLowerCase().includes('primary');
      const isCollision = v.role.toLowerCase().includes('collision');
      return {
        id: `hist-vessel-${i}`,
        mmsi: v.mmsi || `3${i}891000${i}`,
        vesselName: v.name,
        callsign: `HIST-${i}`,
        flag: v.flag,
        vesselType: mapVesselType(v.type),
        imo: v.imo || `900000${i}`,
        closestPointDistanceKm: v.distanceFromSpillKm,
        timeOfClosestApproach: hist.formattedDate,
        speedKnots: v.speedKnots,
        headingDeg: v.headingDeg,
        trajectoryMatchScore: isCulprit ? 98.4 : isCollision ? 88.0 : 45.0,
        riskLevel: isCulprit ? 'CRITICAL' : isCollision ? 'HIGH' : 'LOW',
        aisAnomaly: isCulprit || isCollision,
        anomalyReason: v.notes,
        coordinates: {
          lat: hist.centroid.lat + Math.sin(angle) * distDeg,
          lng: hist.centroid.lng + Math.cos(angle) * distDeg,
        },
        historicalTrack: [
          { lat: hist.centroid.lat + 0.05, lng: hist.centroid.lng - 0.05 },
          { lat: hist.centroid.lat, lng: hist.centroid.lng },
          { lat: hist.centroid.lat + Math.sin(angle) * distDeg, lng: hist.centroid.lng + Math.cos(angle) * distDeg },
        ],
      };
    });

    const typedCoordinates: [number, number][][] = hist.slickPolygon.coordinates.map((ring) =>
      ring.map((pt) => [pt[0], pt[1]] as [number, number])
    );

    const convertedResult: SarAnalysisResult = {
      id: hist.id,
      timestamp: hist.date,
      status: 'completed',
      sarMetadata: {
        satelliteName: hist.satelliteSensor.sensorName,
        sensorType: sensorBand,
        polarization: polarization,
        acquisitionTime: hist.formattedDate,
        orbitPass: orbitPass,
        incidentAngle: 35.0,
        resolutionMeters: hist.satelliteSensor.resolutionMeters,
        sceneBounds: {
          north: hist.centroid.lat + 0.3,
          south: hist.centroid.lat - 0.3,
          east: hist.centroid.lng + 0.3,
          west: hist.centroid.lng - 0.3,
        },
      },
      environmentalConditions: {
        windSpeedMps: hist.metocean.windSpeedMps,
        windDirectionDeg: hist.metocean.windDirectionDeg,
        currentSpeedMps: hist.metocean.waterCurrentSpeedMps,
        currentDirectionDeg: hist.metocean.waterCurrentDirectionDeg,
        waterTemperatureC: hist.metocean.seaTemperatureC,
        waveHeightMeters: hist.metocean.waveHeightMeters,
        oilApiGravity: hist.spillVolume.apiGravity,
        spillVolumeEstimatedM3: hist.spillVolume.amountM3,
      },
      detection: {
        slickDetected: true,
        confidenceScore: 96.5,
        confidenceRating: 'High',
        braggDampingDetected: true,
        contrastRatioDb: -8.4,
        contrastGradient: 9.2,
        windConditionSuitability: 'Optimal (3-12 m/s)',
      },
      metrics: {
        centre: { lat: hist.centroid.lat, lng: hist.centroid.lng },
        areaKm2: hist.spillVolume.areaCoveredKm2,
        areaHectares: hist.spillVolume.areaCoveredKm2 * 100,
        perimeterKm: Math.round(Math.sqrt(hist.spillVolume.areaCoveredKm2) * 4.5 * 10) / 10,
        lengthMajorAxisKm: Math.round(Math.sqrt(hist.spillVolume.areaCoveredKm2) * 2.2 * 10) / 10,
        widthMinorAxisKm: Math.round((hist.spillVolume.areaCoveredKm2 / (Math.sqrt(hist.spillVolume.areaCoveredKm2) * 2.2 || 1)) * 10) / 10,
        estimatedVolumeMinM3: Math.round(hist.spillVolume.amountM3 * 0.8),
        estimatedVolumeMaxM3: Math.round(hist.spillVolume.amountM3 * 1.3),
      },
      slickContour: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: typedCoordinates,
        },
        properties: {
          id: hist.id,
          areaKm2: hist.spillVolume.areaCoveredKm2,
          areaHectares: hist.spillVolume.areaCoveredKm2 * 100,
          perimeterKm: Math.round(Math.sqrt(hist.spillVolume.areaCoveredKm2) * 4.5 * 10) / 10,
          meanBackscatterDb: -23.1,
          ambientBackscatterDb: -14.2,
          dampingRatioDb: 8.9,
          slickType: mapSlickType(hist.spillVolume.oilType),
        },
      },
      candidates: parsedCandidates,
      sourceEstimation: {
        backtrackedOrigin: { lat: hist.centroid.lat, lng: hist.centroid.lng },
        estimatedSpillTime: hist.formattedDate,
        originUncertaintyRadiusKm: 0.8,
        mostLikelySource: parsedCandidates[0] || null,
      },
      driftSimulation: {
        modelType: 'Euler-Lagrangian Particle Trajectory + Stokes Drift',
        totalSteps: hist.driftTrajectory.length,
        forecastHours: hist.driftTrajectory[hist.driftTrajectory.length - 1]?.stepHours || 48,
        trajectory: hist.driftTrajectory.map((t) => ({
          timestepHours: t.stepHours,
          timestamp: `+${t.stepHours}h`,
          centroid: { lat: t.lat, lng: t.lng },
          majorAxisKm: Math.sqrt(t.slickAreaKm2) * 1.2,
          minorAxisKm: Math.sqrt(t.slickAreaKm2) * 0.7,
          orientationDeg: hist.metocean.waterCurrentDirectionDeg,
          particles: Array.from({ length: 30 }, (_, idx) => ({
            id: idx,
            lat: t.lat + (Math.random() - 0.5) * (Math.sqrt(t.slickAreaKm2) * 0.01),
            lng: t.lng + (Math.random() - 0.5) * (Math.sqrt(t.slickAreaKm2) * 0.01),
            ageHours: t.stepHours,
            massFractionRemaining: Math.max(0.2, 1 - t.stepHours * 0.015),
            status: t.shorelineHit && idx % 3 === 0 ? ('beached' as const) : ('active' as const),
          })),
          uncertaintyPolygon: [
            [t.lat + 0.02, t.lng - 0.02],
            [t.lat + 0.03, t.lng + 0.02],
            [t.lat - 0.02, t.lng + 0.03],
            [t.lat - 0.03, t.lng - 0.02],
          ] as [number, number][],
          evaporationPercentage: Math.min(45, t.stepHours * 0.9),
          areaKm2: t.slickAreaKm2,
        })),
      },
      uncertaintyAnalysis: {
        confidenceEllipse95: {
          center: { lat: hist.centroid.lat, lng: hist.centroid.lng },
          semiMajorKm: Math.sqrt(hist.spillVolume.areaCoveredKm2) * 1.4,
          semiMinorKm: Math.sqrt(hist.spillVolume.areaCoveredKm2) * 0.8,
          angleDeg: hist.metocean.waterCurrentDirectionDeg,
        },
        sensitivityFactors: [
          { factor: 'Metocean Wind Drift Ratio (3% law)', impact: 'HIGH', description: `Sustained wind of ${hist.metocean.windSpeedMps} m/s blowing towards ${(hist.metocean.windDirectionDeg + 180) % 360}°.` },
          { factor: 'Surface Water Current Velocity', impact: 'HIGH', description: `Ocean current velocity at ${hist.metocean.waterCurrentSpeedMps} m/s.` },
          { factor: 'Oil API Gravity & Weathering', impact: 'MEDIUM', description: `API ${hist.spillVolume.apiGravity}° crude oil with emulsification rate.` },
        ],
        warnings: hist.driftTrajectory.some(t => t.shorelineHit) ? ['High risk of shoreline contact within modeled trajectory timeline.'] : [],
        shorelineIntersectionRisk: hist.driftTrajectory.some((t) => t.shorelineHit),
        estimatedLandfallHours: hist.driftTrajectory.find((t) => t.shorelineHit)?.stepHours || null,
      },
      reportSummary: hist.summary,
    };

    setAnalysisResult(convertedResult);
    setAiReportNarrative(hist.fullNarrativeMarkdown);
    setActiveTimestep(0);
    setUploadedFileName(null);
  };

  const loadPrecalibratedScene = async (sceneId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisProgressPercent(15);
    setAnalysisStepProgress('Ingesting spaceborne SAR GRDH scene telemetry...');

    try {
      // Simulate radar pipeline verification steps for realistic satellite telemetry feedback
      await new Promise((r) => setTimeout(r, 400));
      setAnalysisProgressPercent(40);
      setAnalysisStepProgress('Applying Enhanced Lee Speckle Filter & dB Conversion...');

      await new Promise((r) => setTimeout(r, 400));
      setAnalysisProgressPercent(70);
      setAnalysisStepProgress('Computing CFAR Capillary Wave Dampening (Bragg Resonance)...');

      const response = await fetch('/api/sar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId }),
      });

      if (!response.ok) {
        throw new Error(`SAR backend service returned error HTTP ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.success || !resJson.data) {
        throw new Error(resJson.error || 'Failed to parse SAR analysis data');
      }

      setAnalysisProgressPercent(100);
      setAnalysisStepProgress('Analysis complete.');
      setAnalysisResult(resJson.data);

      // Sync environmental state
      if (resJson.data.environmentalConditions) {
        setEnvWindSpeed(resJson.data.environmentalConditions.windSpeedMps);
        setEnvWindDir(resJson.data.environmentalConditions.windDirectionDeg);
        setEnvCurrentSpeed(resJson.data.environmentalConditions.currentSpeedMps);
        setEnvCurrentDir(resJson.data.environmentalConditions.currentDirectionDeg);
        setEnvSpillVolume(resJson.data.environmentalConditions.spillVolumeEstimatedM3);
      }

      setActiveTimestep(0);
      setUploadedFileName(null);
    } catch (err: any) {
      console.error('SAR Analysis Error:', err);
      setErrorMessage(
        `Unable to reach backend SAR engine: ${err.message}. Please check local server status or upload a fresh SAR GeoTIFF.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom file upload
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setUploadedFileName(file.name);
    setAnalysisProgressPercent(20);
    setAnalysisStepProgress(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);

    const formData = new FormData();
    formData.append('sarImage', file);
    formData.append('windSpeedMps', envWindSpeed.toString());
    formData.append('windDirectionDeg', envWindDir.toString());
    formData.append('currentSpeedMps', envCurrentSpeed.toString());
    formData.append('currentDirectionDeg', envCurrentDir.toString());
    formData.append('spillVolumeEstimatedM3', envSpillVolume.toString());

    try {
      setAnalysisProgressPercent(50);
      setAnalysisStepProgress('Calibrating radar incident angles and dark spot contrast...');

      const response = await fetch('/api/sar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with HTTP ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.success || !resJson.data) {
        throw new Error(resJson.error || 'Backend failed to process SAR image file');
      }

      setAnalysisProgressPercent(100);
      setAnalysisStepProgress('Custom SAR dataset processed successfully.');
      setAnalysisResult(resJson.data);
      setActiveTimestep(0);
    } catch (err: any) {
      console.error('SAR Upload Error:', err);
      setErrorMessage(`Failed to process uploaded file: ${err.message}. Ensure it is a valid radar image file.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-simulate Drift when environmental sliders are adjusted
  const handleUpdateEnvironmentalSimulation = async () => {
    if (!analysisResult) return;
    setIsSimulatingDrift(true);

    try {
      const updatedEnv: EnvironmentalConditions = {
        ...analysisResult.environmentalConditions,
        windSpeedMps: envWindSpeed,
        windDirectionDeg: envWindDir,
        currentSpeedMps: envCurrentSpeed,
        currentDirectionDeg: envCurrentDir,
        spillVolumeEstimatedM3: envSpillVolume,
      };

      const response = await fetch('/api/sar/drift-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialCentre: analysisResult.metrics.centre,
          environmentalConditions: updatedEnv,
          forecastHours: 24,
          stepIntervalHours: 6,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.trajectory) {
          setAnalysisResult({
            ...analysisResult,
            environmentalConditions: updatedEnv,
            driftSimulation: {
              ...analysisResult.driftSimulation,
              trajectory: json.trajectory,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Drift simulation re-calc error:', err);
    } finally {
      setIsSimulatingDrift(false);
    }
  };

  // Generate Gemini AI Forensic Narrative
  const handleGenerateAiNarrative = async () => {
    if (!analysisResult) return;
    setIsGeneratingNarrative(true);
    setAiReportNarrative(null);

    try {
      const response = await fetch('/api/gemini/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult,
          promptContext: 'MARPOL Annex I official coast guard dossier',
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.narrative) {
          setAiReportNarrative(json.narrative);
        }
      }
    } catch (err) {
      console.error('AI Narrative Generation Error:', err);
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  // Run Multimodal Cross-Modal Attribution from Workbench
  const handleExecuteWorkbenchMultimodal = async () => {
    if (!analysisResult) return;
    setIsProcessingWorkbenchMultimodal(true);
    try {
      const topCand = analysisResult.candidates?.[0];
      const response = await fetch('/api/multimodal/cross-modal-attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spillMetrics: {
            areaKm2: analysisResult.metrics.areaKm2,
            dampingRatioDb: analysisResult.slickContour?.properties?.dampingRatioDb || 7.8,
            centroid: analysisResult.metrics.centre,
          },
          aisTelemetry: analysisResult.candidates?.slice(0, 3).map((c) => ({
            mmsi: c.mmsi,
            name: c.vesselName,
            sog: c.speedKnots,
            cog: c.headingDeg,
            cpaKm: c.closestPointDistanceKm,
            gap: c.aisAnomaly ? (c.anomalyReason || 'Transponder gap detected') : 'NONE',
          })),
          manifestData: `Bill of Lading #BL-9924-HFO
Vessel: ${topCand?.vesselName || 'MT SEA HORIZON'} (IMO ${topCand?.imo || '9248734'}, Flag: ${topCand?.flag || 'Marshall Islands'})
Shipper: Gulf Terminal Logistics | Consignee: Regional Marine Hub
Cargo Manifested: 42,500 Metric Tons Heavy Fuel Oil (HFO 380 cSt, API Gravity 15.4, Sulfur 0.48%)
Hazardous Code: IMDG Class 3, UN 1268, SOPEP Tier-1 Required.`,
          metoceanData: analysisResult.environmentalConditions,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setWorkbenchMultimodalResult(json.data);
        }
      }
    } catch (err) {
      console.error('Workbench multimodal error:', err);
    } finally {
      setIsProcessingWorkbenchMultimodal(false);
    }
  };

  // Download Forensic JSON Report
  const handleDownloadJsonReport = () => {
    if (!analysisResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(analysisResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SpillTwin_Investigation_${analysisResult.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print / Save PDF Dossier
  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="py-8 lg:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Workbench Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              SAR Investigation Workbench
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Satellite SAR detection, Bragg damping verification, hydrodynamic drift forecasting &amp; AIS attribution.
          </p>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-2">
          {analysisResult && (
            <>
              <button
                onClick={handleDownloadJsonReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
                title="Download JSON Report"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handlePrintDossier}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/60 text-white text-xs font-mono transition-colors cursor-pointer"
                title="Print Forensic Dossier"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Level 1: Scannable Current Incident Status Bar */}
      {analysisResult && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-center">
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">Incident</span>
              <span className="text-sm sm:text-base font-bold font-mono text-white mt-0.5 block">SP-2026-001</span>
              <span className="text-[10px] text-slate-400 font-mono truncate block">{analysisResult.id}</span>
            </div>
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">Status</span>
              <span className="text-xs sm:text-sm font-semibold text-cyan-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Under Investigation
              </span>
              <span className="text-[10px] text-slate-400 block">Verified target</span>
            </div>
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">Severity</span>
              <span className="text-xs sm:text-sm font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                High
              </span>
              <span className="text-[10px] text-slate-400 block">{analysisResult.metrics.areaKm2} km²</span>
            </div>
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">Location</span>
              <span className="text-xs sm:text-sm font-semibold text-white block truncate mt-0.5">
                {SAMPLE_SAR_SCENES.find(s => s.id === selectedSceneId)?.region.split('/')[0].trim() || 'Arabian Sea'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {analysisResult.metrics.centre.lat.toFixed(2)}°N, {analysisResult.metrics.centre.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col sm:items-end justify-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400">Confidence</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {analysisResult.detection.confidenceScore.toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400">Bragg damping</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls: Pre-calibrated Scenes or Custom File Upload */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Pre-calibrated Scene Selector */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            Select Authentic Pre-calibrated SAR Dataset:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_SAR_SCENES.map((scene) => {
              const isSelected = selectedSceneId === scene.id && !uploadedFileName;
              return (
                <button
                  key={scene.id}
                  onClick={() => {
                    setSelectedSceneId(scene.id);
                    setUploadedFileName(null);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400/80 shadow-md shadow-cyan-950/50 text-white'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200 line-clamp-1">{scene.title}</p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-1">{scene.satellite}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{scene.initialResult.metrics.areaKm2} km²</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Custom SAR Image Upload Dropzone */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Or Ingest Raw SAR Image File:
          </label>
          
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/40'
                : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg,.dat"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs font-medium text-slate-300">
                {uploadedFileName ? (
                  <span className="text-cyan-300 font-mono font-bold">Uploaded: {uploadedFileName}</span>
                ) : (
                  <span>Click to select or drag &amp; drop SAR file</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                GeoTIFF (.tif), Sentinel-1 GRD, PNG, JPEG (up to 50MB)
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Analysis Loading Progress Bar */}
      {isLoading && (
        <div className="mt-6 p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 mb-2">
            <span className="flex items-center gap-2">
              <Satellite className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>{analysisStepProgress}</span>
            </span>
            <span>{analysisProgressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${analysisProgressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-6 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5">Investigation Pipeline Alert</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Results Layout: Map & Telemetry Dashboard */}
      {analysisResult && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Full Leaflet GIS Map with real layers */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* GIS Map & Tactical D3 Heatmap Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Tactical SAR &amp; GIS Tracking
                    </h2>
                    {mapVisualizationMode === 'heatmap' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
                        <Flame className="w-3 h-3 text-amber-400 animate-pulse" /> D3.js Density Active
                      </span>
                    )}
                    {mapVisualizationMode === 'raw' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-bold">
                        Raw Radar Suppression
                      </span>
                    )}
                    {mapVisualizationMode === 'hybrid' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-300" /> Dual Hybrid Fusion
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Sensor: <span className="text-slate-200">{analysisResult.sarMetadata.satelliteName}</span> • Footprint: <span className="text-cyan-300 font-bold">{analysisResult.metrics.areaKm2} km²</span>
                  </p>
                </div>
              </div>

              {/* Mode Toggle Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/90 self-start sm:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setMapVisualizationMode('raw')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    mapVisualizationMode === 'raw'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="View raw Synthetic Aperture Radar backscatter damping polygon"
                >
                  Raw SAR
                </button>

                <button
                  type="button"
                  onClick={() => setMapVisualizationMode('heatmap')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    mapVisualizationMode === 'heatmap'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold shadow-sm shadow-rose-950/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="View D3.js Gaussian spill concentration density contours"
                >
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>D3 Heatmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMapVisualizationMode('hybrid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    mapVisualizationMode === 'hybrid'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title="Overlay D3 density heatmap atop raw SAR suppression contours"
                >
                  <span>Hybrid</span>
                </button>

                <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={() => {
                    setActiveViewTab('multimodal');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 text-cyan-300 border border-indigo-500/40 shadow-sm transition-all"
                  title="Open Multimodal AI Intake Panel"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Multimodal AI</span>
                </button>
              </div>
            </div>

            {/* Dynamic Multimodal AI Event Notification Banner */}
            {multimodalAlertBanner && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-400/80 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-2xl animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold">{multimodalAlertBanner}</span>
                </div>
                <button
                  onClick={() => setMultimodalAlertBanner(null)}
                  className="px-2 py-0.5 rounded text-cyan-400 hover:text-white bg-slate-900 border border-slate-700 text-[10px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* The Leaflet Map Component */}
            <SarMap
              analysisResult={analysisResult}
              selectedCandidateId={selectedCandidateId}
              onSelectCandidate={(id) => {
                setSelectedCandidateId(id);
                setActiveViewTab('candidates');
              }}
              activeTimestep={activeTimestep}
              visualizationMode={mapVisualizationMode}
              onToggleVisualizationMode={setMapVisualizationMode}
              colorScale={heatmapColorScale}
              onColorScaleChange={setHeatmapColorScale}
              heatmapOpacity={heatmapOpacity}
              onHeatmapOpacityChange={setHeatmapOpacity}
            />

            {/* D3 Hydrocarbon Density Metrics Strip (visible in heatmap & hybrid modes) */}
            {(mapVisualizationMode === 'heatmap' || mapVisualizationMode === 'hybrid') && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-amber-900/30 text-xs font-mono">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Peak Concentration</span>
                  <span className="text-rose-400 font-bold text-sm">~280 g/m²</span>
                  <span className="text-[10px] text-slate-500 block">Heavy Emulsion</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Core Slick Layer</span>
                  <span className="text-amber-400 font-bold text-sm">&gt; 200 µm</span>
                  <span className="text-[10px] text-slate-500 block">IMO Bonn Code 5</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Sheen Perimeter</span>
                  <span className="text-cyan-400 font-bold text-sm">0.04 - 0.3 µm</span>
                  <span className="text-[10px] text-slate-500 block">Silvery Micro-film</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">D3 Interpolator</span>
                  <span className="text-emerald-400 font-bold text-sm">Bivariate KDE</span>
                  <span className="text-[10px] text-slate-500 block">Contour Density</span>
                </div>
              </div>
            )}

            {/* Interactive Drift Timestep Slider (+0h to +24h) */}
            {analysisResult.driftSimulation?.trajectory?.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Drift Forecast Horizon</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    T + {analysisResult.driftSimulation.trajectory[activeTimestep]?.timestepHours || 0} Hours
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {analysisResult.driftSimulation.trajectory.map((step, idx) => (
                    <button
                      key={step.timestepHours}
                      onClick={() => setActiveTimestep(idx)}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                        activeTimestep === idx
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      +{step.timestepHours}h
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>
                    <span>Centroid:</span>{' '}
                    <span className="text-slate-200">
                      {analysisResult.driftSimulation.trajectory[activeTimestep]?.centroid.lat.toFixed(3)}°,{' '}
                      {analysisResult.driftSimulation.trajectory[activeTimestep]?.centroid.lng.toFixed(3)}°
                    </span>
                  </div>
                  <div>
                    <span>Area:</span>{' '}
                    <span className="text-slate-200">
                      {analysisResult.driftSimulation.trajectory[activeTimestep]?.areaKm2} km²
                    </span>
                  </div>
                  <div>
                    <span>Evaporated:</span>{' '}
                    <span className="text-slate-200">
                      {analysisResult.driftSimulation.trajectory[activeTimestep]?.evaporationPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Telemetry, Candidate Vessels, Environmental Controls, & Report */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* View Sub-Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
              <button
                onClick={() => setActiveViewTab('overview')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeViewTab === 'overview' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveViewTab('candidates')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeViewTab === 'candidates' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Candidates ({analysisResult.candidates?.length || 0})
              </button>
              <button
                onClick={() => setActiveViewTab('drift')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeViewTab === 'drift' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Physics
              </button>
              <button
                onClick={() => setActiveViewTab('report')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeViewTab === 'report' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dossier
              </button>
              <button
                onClick={() => setActiveViewTab('multimodal')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                  activeViewTab === 'multimodal'
                    ? 'bg-slate-800 text-cyan-300 font-semibold'
                    : 'text-cyan-400 hover:text-cyan-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Multimodal</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeViewTab === 'overview' && (
              <div className="space-y-4">
                
                {/* Primary Metrics Card */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wide">
                        SAR Detection Verdict
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {analysisResult.detection.confidenceRating} Confidence
                    </span>
                  </div>

                  {/* 4 Prominent Values */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-mono block">Confidence Score</span>
                      <span className="text-2xl font-bold font-mono text-cyan-400 mt-0.5 block">
                        {analysisResult.detection.confidenceScore}%
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Bragg suppression verified</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-mono block">Slick Surface Area</span>
                      <span className="text-2xl font-bold font-mono text-white mt-0.5 block">
                        {analysisResult.metrics.areaKm2} <span className="text-xs font-normal text-slate-400">km²</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">{analysisResult.metrics.areaHectares} Hectares</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-mono block">Backscatter Damping</span>
                      <span className="text-lg font-bold font-mono text-cyan-300 mt-0.5 block">
                        -{analysisResult.slickContour.properties.dampingRatioDb} dB
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Capillary ripple suppression</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-mono block">Estimated Volume</span>
                      <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
                        {analysisResult.metrics.estimatedVolumeMinM3}–{analysisResult.metrics.estimatedVolumeMaxM3} m³
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Hydrocarbon film estimation</span>
                    </div>
                  </div>

                  {/* Technical Radar Data */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dimensions:</span>
                      <span className="text-white font-semibold">
                        {analysisResult.metrics.lengthMajorAxisKm} km (major) × {analysisResult.metrics.widthMinorAxisKm} km (minor)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Satellite Sensor:</span>
                      <span className="text-white">{analysisResult.sarMetadata.satelliteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Polarization / Mode:</span>
                      <span className="text-white">{analysisResult.sarMetadata.polarization} · {analysisResult.sarMetadata.sensorMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incident Centroid:</span>
                      <span className="text-slate-200">
                        {analysisResult.metrics.centre.lat.toFixed(4)}°N, {analysisResult.metrics.centre.lng.toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                </div>

                {/* Backtracked Source Origin Card */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800/80 mb-3">
                    <Ship className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-semibold text-amber-300 uppercase tracking-wide">
                      Backtracked Spill Origin
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400">Origin Centroid:</span>
                      <span className="text-white font-bold">
                        {analysisResult.sourceEstimation.backtrackedOrigin.lat.toFixed(4)}°N,{' '}
                        {analysisResult.sourceEstimation.backtrackedOrigin.lng.toFixed(4)}°E
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400">Estimated Release Time:</span>
                      <span className="text-slate-200">{analysisResult.sourceEstimation.estimatedSpillTime}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400">Uncertainty Radius:</span>
                      <span className="text-amber-300 font-semibold">±{analysisResult.sourceEstimation.originUncertaintyRadiusKm} km</span>
                    </div>
                  </div>
                </div>

                {/* Warnings / Sensitivity */}
                {analysisResult.uncertaintyAnalysis.warnings?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Environmental Sensitivity Warnings</span>
                    </span>
                    <ul className="space-y-1.5 text-slate-300">
                      {analysisResult.uncertaintyAnalysis.warnings.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: CANDIDATE VESSELS RANKING */}
            {activeViewTab === 'candidates' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                  <span>Bayesian Ranked AIS Targets</span>
                  <span>{analysisResult.candidates?.length} Identified</span>
                </div>

                {analysisResult.candidates?.map((candidate, idx) => {
                  const isSelected = selectedCandidateId === candidate.id;
                  const isCritical = candidate.riskLevel === 'CRITICAL';
                  const isHigh = candidate.riskLevel === 'HIGH';

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400/80 shadow-lg'
                          : 'bg-slate-950/60 hover:bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                          <div>
                            <h4 className="text-sm font-bold text-white font-mono">{candidate.vesselName}</h4>
                            <p className="text-[11px] text-slate-400 font-mono">
                              MMSI: {candidate.mmsi} | IMO: {candidate.imo} ({candidate.flag})
                            </p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isCritical ? 'bg-red-950 text-red-300 border border-red-800' : isHigh ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'bg-blue-950 text-blue-300'
                        }`}>
                          {candidate.riskLevel} ({candidate.trajectoryMatchScore}%)
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-900">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Type</span>
                          <span>{candidate.vesselType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">CPA Distance</span>
                          <span className="text-cyan-300">{candidate.closestPointDistanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Speed / Heading</span>
                          <span>{candidate.speedKnots} kn @ {candidate.headingDeg}°</span>
                        </div>
                      </div>

                      {candidate.aisAnomaly && (
                        <div className="mt-2.5 p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-[11px] text-red-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span>{candidate.anomalyReason || 'AIS transponder outage or sudden speed variation recorded.'}</span>
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono">
                          {isSelected ? 'Track Locked on Radar' : 'Click to inspect track'}
                        </span>
                        <span className="text-cyan-400 font-semibold">
                          {isSelected ? 'Active Target' : 'Lock Track →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: DRIFT PHYSICS & ENVIRONMENTAL ADJUSTMENT */}
            {activeViewTab === 'drift' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Environmental Hydrodynamics</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Euler-Lagrangian</span>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4 text-xs font-mono">
                    
                    {/* Wind Speed */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">10m Wind Speed (U10):</span>
                        <span className="text-cyan-400 font-bold">{envWindSpeed} m/s</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.1"
                        value={envWindSpeed}
                        onChange={(e) => setEnvWindSpeed(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    {/* Wind Direction */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Wind Direction (From):</span>
                        <span className="text-cyan-400 font-bold">{envWindDir}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="359"
                        step="5"
                        value={envWindDir}
                        onChange={(e) => setEnvWindDir(parseInt(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    {/* Current Speed */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Ocean Current Velocity:</span>
                        <span className="text-cyan-400 font-bold">{envCurrentSpeed} m/s</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="2.5"
                        step="0.05"
                        value={envCurrentSpeed}
                        onChange={(e) => setEnvCurrentSpeed(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    {/* Current Direction */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Current Direction (Towards):</span>
                        <span className="text-cyan-400 font-bold">{envCurrentDir}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="359"
                        step="5"
                        value={envCurrentDir}
                        onChange={(e) => setEnvCurrentDir(parseInt(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    {/* Re-simulate button */}
                    <button
                      onClick={handleUpdateEnvironmentalSimulation}
                      disabled={isSimulatingDrift}
                      className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isSimulatingDrift ? 'animate-spin' : ''}`} />
                      <span>{isSimulatingDrift ? 'Recalculating Particles...' : 'Update Trajectory Model'}</span>
                    </button>
                  </div>
                </div>

                {/* Sensitivity Matrix */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <p className="font-bold text-slate-300 mb-2">Uncertainty Sensitivity Matrix:</p>
                  <div className="space-y-2">
                    {analysisResult.uncertaintyAnalysis.sensitivityFactors?.map((f, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="flex items-center justify-between text-cyan-300 font-bold">
                          <span>{f.factor}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.impact === 'HIGH' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-300'}`}>
                            {f.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FORENSIC DOSSIER & AI SUMMARY */}
            {activeViewTab === 'report' && (
              <div className="space-y-4">
                
                {/* AI Briefing Generator */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>MARPOL Annex I Forensic Assessment</span>
                    </span>
                    <button
                      onClick={handleGenerateAiNarrative}
                      disabled={isGeneratingNarrative}
                      className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 text-xs font-bold font-mono hover:bg-cyan-400 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className={`w-3 h-3 ${isGeneratingNarrative ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingNarrative ? 'Synthesizing...' : 'Generate Expert Assessment'}</span>
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                    {aiReportNarrative ? (
                      aiReportNarrative
                    ) : (
                      <span className="text-slate-400 italic">
                        Click &quot;Generate Expert Assessment&quot; to synthesize an official MARPOL 73/78 forensic dossier linking satellite radar damping and AIS transponder tracks.
                      </span>
                    )}
                  </div>
                </div>

                {/* Incident Technical Specs Table */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-2">
                  <span className="font-bold text-slate-200 block pb-2 border-b border-slate-800">
                    Satellite Scene Parameters:
                  </span>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Incident Dossier ID:</span>
                    <span className="text-cyan-300">{analysisResult.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Radar Sensor:</span>
                    <span className="text-slate-200">{analysisResult.sarMetadata.satelliteName} ({analysisResult.sarMetadata.sensorType})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Polarization:</span>
                    <span className="text-slate-200">{analysisResult.sarMetadata.polarization}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Incident Angle:</span>
                    <span className="text-slate-200">{analysisResult.sarMetadata.incidentAngle}°</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Spatial Resolution:</span>
                    <span className="text-slate-200">{analysisResult.sarMetadata.resolutionMeters} m / pixel</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: MULTIMODAL INTAKE & REASONING PANEL */}
            {activeViewTab === 'multimodal' && (
              <div className="space-y-4">
                <MultimodalIntakePanel
                  onSpawnSpillAt={spawnSpillAt}
                  onHighlightVessel={highlightVessel}
                  physicsScores={mappedPhysicsScores}
                  spillMetrics={{
                    areaKm2: analysisResult.metrics.areaKm2,
                    dampingRatioDb: analysisResult.slickContour?.properties?.dampingRatioDb || 7.8,
                    centroid: analysisResult.metrics.centre,
                  }}
                />
              </div>
            )}

          </div>

        </div>
      )}

      {/* Floating / Pop-out Multimodal AI Modal */}
      {isMultimodalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/40 shadow-2xl bg-slate-950">
            <button
              onClick={() => setIsMultimodalModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <MultimodalIntakePanel
              onSpawnSpillAt={(coords, details) => {
                spawnSpillAt(coords, details);
                setIsMultimodalModalOpen(false);
              }}
              onHighlightVessel={(mmsi) => {
                highlightVessel(mmsi);
                setIsMultimodalModalOpen(false);
              }}
              physicsScores={mappedPhysicsScores}
              spillMetrics={
                analysisResult
                  ? {
                      areaKm2: analysisResult.metrics.areaKm2,
                      dampingRatioDb: analysisResult.slickContour?.properties?.dampingRatioDb || 7.8,
                      centroid: analysisResult.metrics.centre,
                    }
                  : undefined
              }
              onClose={() => setIsMultimodalModalOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
