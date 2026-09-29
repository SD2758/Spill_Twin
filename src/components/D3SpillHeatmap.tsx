import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import { SarAnalysisResult, GeoCoordinate } from '../types';
import { Flame, Layers, Eye, Sliders, Info, ShieldAlert, Sparkles, Activity } from 'lucide-react';

export type HeatmapColorScale = 'bonn' | 'inferno' | 'turbo' | 'plasma';
export type VisualizationMode = 'raw' | 'heatmap' | 'hybrid';

interface D3SpillHeatmapProps {
  map: L.Map | null;
  analysisResult: SarAnalysisResult | null;
  activeTimestep: number;
  visualizationMode: VisualizationMode;
  colorScale?: HeatmapColorScale;
  opacity?: number;
  onHoverPoint?: (info: { concentration: number; code: string; thickness: string } | null) => void;
}

interface DensityPoint {
  x: number;
  y: number;
  weight: number;
  lat: number;
  lng: number;
}

export const D3SpillHeatmap: React.FC<D3SpillHeatmapProps> = ({
  map,
  analysisResult,
  activeTimestep,
  visualizationMode,
  colorScale = 'bonn',
  opacity = 0.75,
  onHoverPoint,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<{
    density: number;
    bonnCode: string;
    thickness: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Derive sample density points from slick geometry, centroid, and particles
  const rawGeoPoints = useMemo(() => {
    if (!analysisResult) return [];

    const points: { lat: number; lng: number; weight: number }[] = [];
    const centre = analysisResult.metrics.centre;
    const estVol = analysisResult.environmentalConditions?.spillVolumeEstimatedM3 || 450;
    const baseWeight = Math.min(1.0, Math.max(0.3, estVol / 500));

    // 1. Slick contour vertices
    const contourCoords = analysisResult.slickContour?.geometry?.coordinates?.[0] || [];
    contourCoords.forEach(([lng, lat]) => {
      points.push({ lat, lng, weight: 0.35 * baseWeight });
    });

    // 2. High-density core around centroid
    const step = analysisResult.driftSimulation?.trajectory?.[activeTimestep];
    const activeCentre = step?.centroid || centre;

    // Center focal point (maximum concentration)
    points.push({ lat: activeCentre.lat, lng: activeCentre.lng, weight: 1.0 });

    // Internal Gaussian dispersion clusters around center
    const radiusLat = 0.015;
    const radiusLng = 0.02;
    const angleStep = Math.PI / 6;

    for (let r = 0.25; r <= 0.85; r += 0.25) {
      const weight = (1.0 - r * 0.7) * baseWeight;
      for (let theta = 0; theta < Math.PI * 2; theta += angleStep) {
        // Skew slightly in direction of metocean current
        const currentDirRad = ((analysisResult.environmentalConditions?.currentDirectionDeg || 145) * Math.PI) / 180;
        const driftSkewX = Math.sin(currentDirRad) * 0.005 * r;
        const driftSkewY = Math.cos(currentDirRad) * 0.005 * r;

        points.push({
          lat: activeCentre.lat + Math.sin(theta) * radiusLat * r + driftSkewY,
          lng: activeCentre.lng + Math.cos(theta) * radiusLng * r + driftSkewX,
          weight: Math.max(0.15, weight),
        });
      }
    }

    // 3. Lagrangian particles for active timestep if available
    if (step?.particles && step.particles.length > 0) {
      step.particles.forEach((p) => {
        points.push({
          lat: p.lat,
          lng: p.lng,
          weight: Math.max(0.2, (p.massFractionRemaining || 0.8) * baseWeight),
        });
      });
    }

    return points;
  }, [analysisResult, activeTimestep]);

  // Color mapper helper
  const getColor = (normalizedValue: number): { fill: string; stroke: string; code: string; thickness: string } => {
    // Bonn Agreement Standard Oil Appearance Code (BAOAC):
    // Code 1: Sheen (0.04 - 0.30 µm) ~ 0.05-0.3 g/m²
    // Code 2: Rainbow (0.30 - 5.0 µm) ~ 0.3-5 g/m²
    // Code 3: Metallic (5.0 - 50 µm) ~ 5-50 g/m²
    // Code 4: Discontinuous True Oil (50 - 200 µm) ~ 50-200 g/m²
    // Code 5: Continuous True Oil / Emulsion (> 200 µm) ~ >200 g/m²

    if (colorScale === 'bonn') {
      if (normalizedValue < 0.18) {
        return { fill: '#38bdf8', stroke: '#7dd3fc', code: 'Code 1: Silvery Sheen', thickness: '0.04 - 0.3 µm' };
      }
      if (normalizedValue < 0.40) {
        return { fill: '#fbbf24', stroke: '#fde047', code: 'Code 2: Rainbow Iridescence', thickness: '0.3 - 5.0 µm' };
      }
      if (normalizedValue < 0.65) {
        return { fill: '#f97316', stroke: '#fb923c', code: 'Code 3: Metallic Sheen', thickness: '5.0 - 50 µm' };
      }
      if (normalizedValue < 0.85) {
        return { fill: '#ef4444', stroke: '#f87171', code: 'Code 4: Discontinuous True Oil', thickness: '50 - 200 µm' };
      }
      return { fill: '#881337', stroke: '#e11d48', code: 'Code 5: Heavy Emulsion Core', thickness: '> 200 µm' };
    }

    // D3 continuous interpolators
    let interpolator = d3.interpolateInferno;
    if (colorScale === 'turbo') interpolator = d3.interpolateTurbo;
    if (colorScale === 'plasma') interpolator = d3.interpolatePlasma;

    const hex = interpolator(Math.max(0, Math.min(1, normalizedValue)));
    const strokeHex = interpolator(Math.min(1, normalizedValue + 0.15));

    let codeDesc = 'Low Dispersion';
    let thicknessDesc = '< 5 µm';
    if (normalizedValue > 0.8) {
      codeDesc = 'Core Heavy Emulsion';
      thicknessDesc = '> 200 µm';
    } else if (normalizedValue > 0.5) {
      codeDesc = 'High Viscosity Slick';
      thicknessDesc = '50 - 200 µm';
    } else if (normalizedValue > 0.25) {
      codeDesc = 'Moderate Hydrocarbon Film';
      thicknessDesc = '5 - 50 µm';
    }

    return { fill: hex, stroke: strokeHex, code: codeDesc, thickness: thicknessDesc };
  };

  // Redraw D3 contours whenever map moves, zooms, or input data changes
  useEffect(() => {
    if (!map || !svgRef.current) return;
    if (visualizationMode === 'raw') {
      // In raw SAR mode, clear D3 contours
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    const container = map.getContainer();
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('width', width).attr('height', height);

    const updateHeatmap = () => {
      if (!map || !svgRef.current) return;

      // Project geo-coordinates to current screen container pixels
      const projectedPoints: DensityPoint[] = [];
      rawGeoPoints.forEach((pt) => {
        try {
          const screenPoint = map.latLngToContainerPoint([pt.lat, pt.lng]);
          // Include points with some margin outside viewport for smooth contours
          if (
            screenPoint.x >= -100 &&
            screenPoint.x <= width + 100 &&
            screenPoint.y >= -100 &&
            screenPoint.y <= height + 100
          ) {
            projectedPoints.push({
              x: screenPoint.x,
              y: screenPoint.y,
              weight: pt.weight,
              lat: pt.lat,
              lng: pt.lng,
            });
          }
        } catch {
          // Point could not be projected
        }
      });

      if (projectedPoints.length < 3) {
        svg.selectAll('*').remove();
        return;
      }

      // Configure D3 Contour Density
      // Adapt bandwidth to current map zoom level for crisp resolution
      const currentZoom = map.getZoom();
      const bandwidth = Math.max(12, Math.min(50, 18 + (currentZoom - 10) * 4));

      const densityEstimator = d3
        .contourDensity<DensityPoint>()
        .x((d) => d.x)
        .y((d) => d.y)
        .weight((d) => d.weight)
        .size([width, height])
        .bandwidth(bandwidth)
        .thresholds(10);

      const contours = densityEstimator(projectedPoints);

      if (!contours || contours.length === 0) {
        svg.selectAll('*').remove();
        return;
      }

      // Find max contour value for normalization
      const maxVal = d3.max(contours, (c) => c.value) || 0.001;

      // D3 GeoPath generator for SVG path strings
      const geoPath = d3.geoPath();

      // Clear previous elements
      svg.selectAll('*').remove();

      // Append Defs for glowing filter
      const defs = svg.append('defs');
      const filter = defs.append('filter').attr('id', 'd3-spill-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
      filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
      filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

      // Create group for contours
      const g = svg.append('g').attr('class', 'd3-contour-group');

      // Bind data to paths
      contours.forEach((contour, idx) => {
        const normalizedVal = Math.min(1, contour.value / maxVal);
        const { fill, stroke, code, thickness } = getColor(normalizedVal);
        const fillAlpha = Math.min(0.85, (0.2 + normalizedVal * 0.65) * opacity);

        const path = g
          .append('path')
          .attr('d', geoPath(contour as any))
          .attr('fill', fill)
          .attr('fill-opacity', fillAlpha)
          .attr('stroke', stroke)
          .attr('stroke-width', normalizedVal > 0.7 ? 1.8 : 1.0)
          .attr('stroke-opacity', Math.min(0.95, opacity + 0.1))
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .style('cursor', 'pointer')
          .style('transition', 'fill-opacity 0.2s ease, stroke-width 0.2s ease');

        if (normalizedVal > 0.6) {
          path.attr('filter', 'url(#d3-spill-glow)');
        }

        // Interactive hover effects
        path
          .on('mouseenter', (event: MouseEvent) => {
            d3.select(event.currentTarget as SVGPathElement)
              .attr('stroke-width', 2.5)
              .attr('fill-opacity', Math.min(1.0, fillAlpha + 0.25));

            const densityEstimateGPerM2 = Math.round(normalizedVal * 280 + 20);
            setHoveredLevel({
              density: densityEstimateGPerM2,
              bonnCode: code,
              thickness: thickness,
              screenX: event.clientX,
              screenY: event.clientY,
            });

            if (onHoverPoint) {
              onHoverPoint({
                concentration: densityEstimateGPerM2,
                code: code,
                thickness: thickness,
              });
            }
          })
          .on('mousemove', (event: MouseEvent) => {
            setHoveredLevel((prev) => (prev ? { ...prev, screenX: event.clientX, screenY: event.clientY } : null));
          })
          .on('mouseleave', (event: MouseEvent) => {
            d3.select(event.currentTarget as SVGPathElement)
              .attr('stroke-width', normalizedVal > 0.7 ? 1.8 : 1.0)
              .attr('fill-opacity', fillAlpha);
            setHoveredLevel(null);
            if (onHoverPoint) onHoverPoint(null);
          });
      });

      // Overlay isobar contour lines with dash pattern for peak tiers
      const peakContours = contours.filter((c) => c.value / maxVal >= 0.5);
      peakContours.forEach((pc) => {
        g.append('path')
          .attr('d', geoPath(pc as any))
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '3, 4')
          .attr('stroke-opacity', 0.6)
          .style('pointer-events', 'none');
      });
    };

    // Initial render
    updateHeatmap();

    // Re-render when Leaflet map pans, zooms, or resizes
    map.on('move', updateHeatmap);
    map.on('moveend', updateHeatmap);
    map.on('zoomend', updateHeatmap);
    map.on('resize', updateHeatmap);

    return () => {
      map.off('move', updateHeatmap);
      map.off('moveend', updateHeatmap);
      map.off('zoomend', updateHeatmap);
      map.off('resize', updateHeatmap);
    };
  }, [map, rawGeoPoints, visualizationMode, colorScale, opacity]);

  if (visualizationMode === 'raw') return null;

  return (
    <>
      {/* SVG Canvas overlay positioned atop the Leaflet map container */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-auto z-[400]"
        style={{ pointerEvents: 'none' }}
      >
        {/* Child paths set pointerEvents: pointer or auto inside D3 rendering */}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredLevel && (
        <div
          className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-slate-950/95 backdrop-blur-md border border-cyan-500/70 rounded-xl shadow-2xl text-xs font-mono text-slate-200"
          style={{ left: hoveredLevel.screenX, top: hoveredLevel.screenY - 10 }}
        >
          <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{hoveredLevel.bonnCode}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
            <span>Concentration:</span>
            <span className="text-white font-bold">{hoveredLevel.density} g/m²</span>
            <span>Thickness:</span>
            <span className="text-amber-300 font-bold">{hoveredLevel.thickness}</span>
          </div>
        </div>
      )}
    </>
  );
};
