import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import { distanceKm, etaMinutes, type LatLng } from "@/lib/geo";
import type { Ambulance, Priority } from "@/lib/types";

export interface AmbulanceCandidate {
  ambulance: Ambulance;
  distanceKm: number;
  etaMinutes: number;
  score: number;
  reasons: string[];
}

const TYPE_RANK: Record<string, number> = {
  NORMAL: 1,
  ICU: 2,
  ADVANCED_LIFE_SUPPORT: 3,
};

const DEFAULT_AMBULANCES: Ambulance[] = [
  // Tenant 1: MCGM South
  {
    id: "amb-101",
    tenant_id: "tenant-mcgm-south",
    ambulance_number: "MH-01-EA-101",
    ambulance_type: "ADVANCED_LIFE_SUPPORT",
    status: "AVAILABLE",
    latitude: 18.929,
    longitude: 72.825,
    traffic_score: 3,
    driver_id: null,
    driver_name: "Rajesh Shinde",
    equipment: ["Ventilator", "Defibrillator", "Oxygen", "ECG Monitor"],
    current_case_id: null,
  },
  {
    id: "amb-102",
    tenant_id: "tenant-mcgm-south",
    ambulance_number: "MH-01-EA-102",
    ambulance_type: "ICU",
    status: "AVAILABLE",
    latitude: 18.941,
    longitude: 72.8285,
    traffic_score: 4,
    driver_id: null,
    driver_name: "Sunil Patil",
    equipment: ["Ventilator", "Oxygen", "Suction Unit", "Stretcher"],
    current_case_id: null,
  },
  {
    id: "amb-103",
    tenant_id: "tenant-mcgm-south",
    ambulance_number: "MH-01-EA-103",
    ambulance_type: "NORMAL",
    status: "AVAILABLE",
    latitude: 18.912,
    longitude: 72.818,
    traffic_score: 2,
    driver_id: null,
    driver_name: "Amit Kadam",
    equipment: ["First Aid Kit", "Oxygen", "Basic Stretcher"],
    current_case_id: null,
  },
  {
    id: "amb-104",
    tenant_id: "tenant-mcgm-south",
    ambulance_number: "MH-01-EA-104",
    ambulance_type: "ADVANCED_LIFE_SUPPORT",
    status: "AVAILABLE",
    latitude: 18.9715,
    longitude: 72.821,
    traffic_score: 5,
    driver_id: null,
    driver_name: "Mahendra Jadhav",
    equipment: ["Ventilator", "Defibrillator", "Infusion Pumps", "Oxygen"],
    current_case_id: null,
  },

  // Tenant 2: Apollo Health Network
  {
    id: "amb-201",
    tenant_id: "tenant-apollo-mumbai",
    ambulance_number: "MH-43-AP-201",
    ambulance_type: "ICU",
    status: "AVAILABLE",
    latitude: 19.0176,
    longitude: 73.018,
    traffic_score: 2,
    driver_id: null,
    driver_name: "Pradeep Rao",
    equipment: ["Cardiac Defibrillator", "Advanced Ventilator", "Telemetry"],
    current_case_id: null,
  },
  {
    id: "amb-202",
    tenant_id: "tenant-apollo-mumbai",
    ambulance_number: "MH-43-AP-202",
    ambulance_type: "ADVANCED_LIFE_SUPPORT",
    status: "AVAILABLE",
    latitude: 19.025,
    longitude: 73.029,
    traffic_score: 3,
    driver_id: null,
    driver_name: "Ganesh Hegde",
    equipment: ["Ventilator", "Oxygen Cylinders", "Multipara Monitor"],
    current_case_id: null,
  },
  {
    id: "amb-203",
    tenant_id: "tenant-apollo-mumbai",
    ambulance_number: "MH-43-AP-203",
    ambulance_type: "NORMAL",
    status: "AVAILABLE",
    latitude: 18.922,
    longitude: 72.834,
    traffic_score: 2,
    driver_id: null,
    driver_name: "Vikram Sawant",
    equipment: ["First Aid", "Portable Oxygen", "Scoop Stretcher"],
    current_case_id: null,
  },

  // Tenant 3: Fortis Critical Care Fleet
  {
    id: "amb-301",
    tenant_id: "tenant-fortis-metro",
    ambulance_number: "MH-03-FT-301",
    ambulance_type: "ADVANCED_LIFE_SUPPORT",
    status: "AVAILABLE",
    latitude: 19.1726,
    longitude: 72.9565,
    traffic_score: 3,
    driver_id: null,
    driver_name: "Nilesh Tawde",
    equipment: ["ECG 12-Lead", "Ventilator", "Cardiac Monitor"],
    current_case_id: null,
  },
  {
    id: "amb-302",
    tenant_id: "tenant-fortis-metro",
    ambulance_number: "MH-03-FT-302",
    ambulance_type: "ICU",
    status: "AVAILABLE",
    latitude: 19.083,
    longitude: 73.001,
    traffic_score: 4,
    driver_id: null,
    driver_name: "Anand Mhatre",
    equipment: ["Ventilator", "Infusion Pump", "Suction Unit"],
    current_case_id: null,
  },

  // Tenant 4: Max & Nanavati Trauma Services
  {
    id: "amb-401",
    tenant_id: "tenant-max-suburban",
    ambulance_number: "MH-02-MX-401",
    ambulance_type: "ADVANCED_LIFE_SUPPORT",
    status: "AVAILABLE",
    latitude: 19.0968,
    longitude: 72.8415,
    traffic_score: 4,
    driver_id: null,
    driver_name: "Sachin More",
    equipment: ["Ventilator", "Trauma Kit", "Defibrillator"],
    current_case_id: null,
  },
  {
    id: "amb-402",
    tenant_id: "tenant-max-suburban",
    ambulance_number: "MH-02-MX-402",
    ambulance_type: "ICU",
    status: "AVAILABLE",
    latitude: 19.0512,
    longitude: 72.8294,
    traffic_score: 3,
    driver_id: null,
    driver_name: "Deepak Shinde",
    equipment: ["Transport Incubator", "Ventilator", "Oxygen"],
    current_case_id: null,
  },
];

let seeded = false;
async function seedDefaultAmbulancesIfEmpty() {
  if (seeded) return;
  try {
    const snap = await getDocs(query(collection(db, "ambulances"), limit(1)));
    if (snap.empty) {
      for (const amb of DEFAULT_AMBULANCES) {
        await setDoc(doc(db, "ambulances", amb.id), amb);
      }
    }
    seeded = true;
  } catch (err) {
    console.warn("Could not check/seed ambulances in Firestore:", err);
  }
}

export async function listAmbulances(tenantId?: string): Promise<Ambulance[]> {
  await seedDefaultAmbulancesIfEmpty();
  try {
    const q = tenantId
      ? query(collection(db, "ambulances"), where("tenant_id", "==", tenantId))
      : query(collection(db, "ambulances"), orderBy("ambulance_number"));
    const snap = await getDocs(q);
    if (snap.empty) {
      if (tenantId) {
        return DEFAULT_AMBULANCES.filter((a) => a.tenant_id === tenantId);
      }
      return DEFAULT_AMBULANCES;
    }
    const results = snap.docs.map((d) => d.data() as Ambulance);
    if (tenantId) {
      return results.filter((a) => !a.tenant_id || a.tenant_id === tenantId);
    }
    return results;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, "ambulances");
    } catch {
      if (tenantId) {
        return DEFAULT_AMBULANCES.filter((a) => a.tenant_id === tenantId);
      }
      return DEFAULT_AMBULANCES;
    }
    if (tenantId) {
      return DEFAULT_AMBULANCES.filter((a) => a.tenant_id === tenantId);
    }
    return DEFAULT_AMBULANCES;
  }
}

/**
 * Weighted dispatch scoring — deliberately NOT "nearest wins".
 * Considers distance, traffic, vehicle capability vs. severity and availability.
 */
export function rankAmbulances(
  ambulances: Ambulance[],
  location: LatLng,
  priority: Priority,
): AmbulanceCandidate[] {
  const needsAdvanced = priority === "CRITICAL" || priority === "HIGH";

  return ambulances
    .filter((a) => a.status === "AVAILABLE")
    .map((a) => {
      const km = distanceKm(location, a);
      const eta = etaMinutes(km, a.traffic_score);
      const reasons: string[] = [];

      let score = 100;
      score -= Math.min(45, km * 7);
      reasons.push(`${km.toFixed(1)} km away`);

      score -= a.traffic_score * 2;
      if (a.traffic_score <= 4) reasons.push("Light traffic on route");
      else if (a.traffic_score >= 7) reasons.push("Heavy traffic on route");

      const rank = TYPE_RANK[a.ambulance_type] ?? 1;
      if (needsAdvanced) {
        score += (rank - 1) * 16;
        if (rank > 1)
          reasons.push(`${a.ambulance_type.replace(/_/g, " ")} capability matches severity`);
        else reasons.push("Basic vehicle — limited for severe cases");
      } else {
        score += rank === 1 ? 8 : 0;
        if (rank === 1) reasons.push("Basic transport is sufficient");
      }

      if (priority === "CRITICAL" && a.equipment.includes("Ventilator")) {
        score += 8;
        reasons.push("Ventilator on board");
      }

      return { ambulance: a, distanceKm: km, etaMinutes: eta, score: Math.round(score), reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export async function updateAmbulance(id: string, patch: Partial<Ambulance>) {
  try {
    await updateDoc(doc(db, "ambulances", id), patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ambulances/${id}`);
  }
}

export async function pushLocation(ambulanceId: string, point: LatLng) {
  try {
    await updateDoc(doc(db, "ambulances", ambulanceId), point);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ambulances/${ambulanceId}`);
  }
}

export async function claimAmbulanceForDriver(userId: string, driverName: string) {
  await seedDefaultAmbulancesIfEmpty();
  try {
    const q1 = query(collection(db, "ambulances"), where("driver_id", "==", userId), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      return snap1.docs[0].data() as Ambulance;
    }

    const snapAll = await getDocs(query(collection(db, "ambulances"), orderBy("ambulance_number")));
    const freeDoc = snapAll.docs.find((d) => !d.data()?.["driver_id"]);
    if (!freeDoc) return null;

    const freeId = freeDoc.id;
    await updateDoc(doc(db, "ambulances", freeId), {
      driver_id: userId,
      driver_name: driverName,
    });
    return { ...(freeDoc.data() as Ambulance), driver_id: userId, driver_name: driverName };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "ambulances");
  }
}

export const ambulanceService = {
  listAmbulances,
  rankAmbulances,
  updateAmbulance,
  pushLocation,
  claimAmbulanceForDriver,
};
