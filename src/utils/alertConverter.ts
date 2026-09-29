import { EarlyWarningAlert, HistoricalSpillData } from '../types';

export function convertAlertToHistoricalSpillData(alert: EarlyWarningAlert): HistoricalSpillData {
  return {
    id: alert.id,
    incidentName: `${alert.alertCode} - ${alert.targetSector.name}`,
    date: alert.timestamp.split('T')[0],
    formattedDate: alert.formattedTime,
    locationName: alert.targetSector.name,
    countryOrSea: alert.targetSector.subZone,
    centroid: {
      lat: alert.targetSector.lat,
      lng: alert.targetSector.lng,
      zoom: 10,
    },
    spillVolume: {
      amountTonnes: alert.detectionDetails.estimatedVolumeTonnes,
      amountBarrels: Math.round(alert.detectionDetails.estimatedVolumeTonnes * 7.33),
      amountM3: alert.detectionDetails.estimatedVolumeM3,
      amountGallons: Math.round(alert.detectionDetails.estimatedVolumeM3 * 264.172),
      oilType: alert.detectionDetails.hydrocarbonType,
      apiGravity: 31.5,
      spillCause: 'Illicit Tank Washing / Operational Discharge Anomaly',
      areaCoveredKm2: alert.detectionDetails.slickAreaKm2,
    },
    metocean: {
      waterCurrentSpeedKnots: Math.round(alert.detectionDetails.metocean.currentSpeedMps * 1.94384 * 10) / 10,
      waterCurrentSpeedMps: alert.detectionDetails.metocean.currentSpeedMps,
      waterCurrentDirectionDeg: alert.detectionDetails.metocean.currentDirDeg,
      waterCurrentDescription: `${alert.detectionDetails.metocean.currentSpeedMps} m/s flowing at ${alert.detectionDetails.metocean.currentDirDeg}°`,
      windSpeedKnots: Math.round(alert.detectionDetails.metocean.windSpeedMps * 1.94384 * 10) / 10,
      windSpeedMps: alert.detectionDetails.metocean.windSpeedMps,
      windDirectionDeg: alert.detectionDetails.metocean.windDirDeg,
      waveHeightMeters: alert.detectionDetails.metocean.waveHeightMeters,
      waveDirectionDeg: alert.detectionDetails.metocean.currentDirDeg,
      seaTemperatureC: 28.5,
      seaStateDescription: 'Moderate Coastal Swell (Douglas Sea State 3)',
    },
    vessels: alert.detectionDetails.suspectVessel
      ? [
          {
            name: alert.detectionDetails.suspectVessel.name,
            mmsi: alert.detectionDetails.suspectVessel.mmsi,
            imo: alert.detectionDetails.suspectVessel.imo,
            flag: alert.detectionDetails.suspectVessel.flag,
            type: alert.detectionDetails.suspectVessel.type,
            speedKnots: alert.detectionDetails.suspectVessel.speedKnots,
            headingDeg: alert.detectionDetails.suspectVessel.headingDeg,
            distanceFromSpillKm: alert.detectionDetails.suspectVessel.distanceFromOriginKm,
            role: 'Culprit / Source Vessel',
            notes: 'High spatial correlation between AIS transponder gap and slick head polygon.',
          },
        ]
      : [],
    satelliteSensor: {
      sensorName: alert.satelliteMission.satelliteName,
      band: 'C-Band Active Microwave Radar',
      polarization: alert.satelliteMission.polarization,
      resolutionMeters: alert.satelliteMission.resolutionMeters,
      passType: alert.satelliteMission.orbitType,
    },
    slickPolygon: {
      type: 'Polygon',
      coordinates: alert.detectionDetails.slickPolygonCoords,
    },
    driftTrajectory: [
      { stepHours: 0, lat: alert.targetSector.lat, lng: alert.targetSector.lng, slickAreaKm2: alert.detectionDetails.slickAreaKm2, shorelineHit: false },
      { stepHours: 6, lat: alert.targetSector.lat + 0.015, lng: alert.targetSector.lng + 0.018, slickAreaKm2: alert.detectionDetails.slickAreaKm2 * 1.4, shorelineHit: false },
      { stepHours: 12, lat: alert.targetSector.lat + 0.03, lng: alert.targetSector.lng + 0.035, slickAreaKm2: alert.detectionDetails.slickAreaKm2 * 1.85, shorelineHit: false },
      { stepHours: 18, lat: alert.targetSector.lat + 0.045, lng: alert.targetSector.lng + 0.052, slickAreaKm2: alert.detectionDetails.slickAreaKm2 * 2.3, shorelineHit: true },
    ],
    ecologicalImpact: {
      mangroveRisk: 'Critical',
      coralReefRisk: 'High',
      fisheriesClosed: true,
      portsAffected: [alert.targetSector.name],
      summary: `Threatens ${alert.detectionDetails.threatenedCoastline} with shoreline contact projected within ${alert.detectionDetails.driftEtaHoursToShore || 14} hours.`,
    },
    summary: `Spaceborne SAR radar detected a ${alert.detectionDetails.slickAreaKm2} km² slick (~${alert.detectionDetails.estimatedVolumeTonnes} Tonnes) in ${alert.targetSector.name}.`,
    fullNarrativeMarkdown: alert.icgMaritimeReportMarkdown,
  };
}
