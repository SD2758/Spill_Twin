import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDocFromServer,
  query,
  limit,
  Firestore
} from 'firebase/firestore';
import type { EarlyWarningAlert, AlertDispatchRecord } from '../types.ts';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

let isConnected = false;

/**
 * Validates connection to Cloud Firestore on boot per security specifications.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnected = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client offline or waiting for network connectivity.');
      isConnected = false;
      return false;
    }
    // If permission denied or document not found, the connection to server is alive
    isConnected = true;
    return true;
  }
}

/**
 * Persists an Early Warning Alert to Firestore
 */
export async function persistAlertToFirestore(alert: EarlyWarningAlert): Promise<void> {
  try {
    const alertRef = doc(db, 'alerts', alert.id);
    const sanitizedData = {
      id: alert.id,
      alertCode: alert.alertCode,
      timestamp: alert.timestamp,
      formattedTime: alert.formattedTime || new Date(alert.timestamp).toISOString(),
      severity: alert.severity,
      sectorName: alert.targetSector?.name || 'India EEZ',
      satellite: alert.satelliteMission?.satelliteName || 'Sentinel-1 C-SAR',
      slickAreaKm2: Number(alert.detectionDetails?.slickAreaKm2 || 0),
      confidenceScore: Number(alert.detectionDetails?.confidenceScore || 0),
      latitude: Number(alert.targetSector?.lat || 18.95),
      longitude: Number(alert.targetSector?.lng || 72.82),
      acknowledged: Boolean(alert.acknowledged),
      suspectedVessel: alert.detectionDetails?.suspectVessel?.name || 'Unknown',
      rawPayload: JSON.stringify(alert),
      updatedAt: new Date().toISOString()
    };
    await setDoc(alertRef, sanitizedData, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to persist alert to Firestore:', err);
  }
}

/**
 * Fetches recent alerts from Firestore
 */
export async function fetchAlertsFromFirestore(maxResults = 25): Promise<EarlyWarningAlert[]> {
  try {
    const alertsCol = collection(db, 'alerts');
    const q = query(alertsCol, limit(maxResults));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    const results: EarlyWarningAlert[] = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.rawPayload) {
        try {
          results.push(JSON.parse(data.rawPayload));
          continue;
        } catch {
          // Fallback if parsing fails
        }
      }
    }
    return results;
  } catch (err) {
    console.warn('[Firestore] Error fetching alerts from Firestore:', err);
    return [];
  }
}

/**
 * Persists an emergency tactical dispatch record
 */
export async function persistDispatchToFirestore(dispatch: AlertDispatchRecord, alertId?: string): Promise<void> {
  try {
    const dispatchRef = doc(db, 'dispatches', dispatch.id);
    await setDoc(dispatchRef, {
      id: dispatch.id,
      channel: dispatch.channel,
      recipient: dispatch.recipient,
      status: dispatch.status,
      sentAt: dispatch.sentAt,
      messageBody: dispatch.messageBody || '',
      carrierReceiptId: dispatch.carrierReceiptId || '',
      alertId: alertId || '',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Firestore] Failed to persist dispatch record:', err);
  }
}

/**
 * Persists an archived forensic SAR investigation dossier
 */
export async function persistInvestigationToFirestore(investigation: {
  id: string;
  title: string;
  region: string;
  satellite: string;
  centerLat: number;
  centerLng: number;
  slickAreaKm2: number;
  confidenceScore: number;
  primaryAttributedVessel?: string;
  primaryAttributedMmsi?: string;
  marpolViolation?: string;
}): Promise<void> {
  try {
    const invRef = doc(db, 'investigations', investigation.id);
    await setDoc(invRef, {
      ...investigation,
      createdAt: new Date().toISOString(),
      status: 'VERIFIED'
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to persist investigation dossier:', err);
  }
}

// Automatically test connection on module load
testFirestoreConnection().catch(() => {});
