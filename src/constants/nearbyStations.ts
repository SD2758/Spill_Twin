import { NearbyPortOrOilStation } from '../types/shipCoordination';

export function computeDistanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const NEARBY_COASTAL_STATIONS: NearbyPortOrOilStation[] = [
  {
    id: 'station-jawahar-dweep',
    name: 'Jawahar Dweep (Butcher Island) Marine Oil Terminal',
    stationType: 'MARINE_OIL_TERMINAL',
    authority: 'Mumbai Port Authority (MbPT) Petroleum Division',
    coordinates: { lat: 18.955, lng: 72.895 },
    canvasPos: { x: 670, y: 70 },
    vhfChannel: 12,
    phoneHotline: '+91-22-6656-4021',
    callSign: 'BUTCHER OIL CONTROL',
    responseReadiness: 'READY_IMMEDIATE',
    tierLevel: 'Tier-1 Immediate',
    skimmerBoatsAvailable: 4,
    boomLengthMeters: 1400,
    dispersantTonnes: 25,
  },
  {
    id: 'station-jnpt-harbor',
    name: 'Jawaharlal Nehru Port (JNPT) Emergency Oil Berth',
    stationType: 'PORT_HARBOR',
    authority: 'JNPA Harbor Marine Dept & Pollution Response',
    coordinates: { lat: 18.948, lng: 72.952 },
    canvasPos: { x: 710, y: 160 },
    vhfChannel: 13,
    phoneHotline: '+91-22-2724-4155',
    callSign: 'JNPT HARBOR VTS',
    responseReadiness: 'READY_IMMEDIATE',
    tierLevel: 'Tier-1 Immediate',
    skimmerBoatsAvailable: 3,
    boomLengthMeters: 1000,
    dispersantTonnes: 18,
  },
  {
    id: 'station-icg-prt',
    name: 'ICG Pollution Response Base (PRT West)',
    stationType: 'COAST_GUARD_BASE',
    authority: 'Indian Coast Guard Western Region HQ',
    coordinates: { lat: 18.995, lng: 72.812 },
    canvasPos: { x: 190, y: 55 },
    vhfChannel: 16,
    phoneHotline: '+91-22-2437-0493',
    callSign: 'COASTGUARD MUMBAI PRT',
    responseReadiness: 'READY_IMMEDIATE',
    tierLevel: 'Tier-2 Regional',
    skimmerBoatsAvailable: 6,
    boomLengthMeters: 2500,
    dispersantTonnes: 60,
  },
  {
    id: 'station-uran-coastal',
    name: 'Uran Coastal Crude Terminal & Marine Depot',
    stationType: 'CRUDE_OFFSHORE_BERTH',
    authority: 'BPCL / ONGC Offshore Logistics Control',
    coordinates: { lat: 18.882, lng: 72.935 },
    canvasPos: { x: 675, y: 380 },
    vhfChannel: 14,
    phoneHotline: '+91-22-2722-1200',
    callSign: 'URAN CRUDE RADIO',
    responseReadiness: 'STANDBY_15MIN',
    tierLevel: 'Tier-1 Immediate',
    skimmerBoatsAvailable: 2,
    boomLengthMeters: 800,
    dispersantTonnes: 15,
  },
];

export function getStationDistances(
  stationsList: NearbyPortOrOilStation[],
  primaryHazardCoordinates?: { lat: number; lng: number } | null
): NearbyPortOrOilStation[] {
  const targetLat = primaryHazardCoordinates ? primaryHazardCoordinates.lat : 18.92;
  const targetLng = primaryHazardCoordinates ? primaryHazardCoordinates.lng : 72.35;

  return stationsList.map((s) => {
    const distNm = computeDistanceNm(targetLat, targetLng, s.coordinates.lat, s.coordinates.lng);
    const dLng = s.coordinates.lng - targetLng;
    const dLat = s.coordinates.lat - targetLat;
    let bearingDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    if (bearingDeg < 0) bearingDeg += 360;

    return {
      ...s,
      distanceNm: parseFloat(distNm.toFixed(1)),
      bearingDeg: Math.round(bearingDeg),
    };
  });
}
