import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import { distanceKm, type LatLng } from "@/lib/geo";
import type { Hospital, Priority } from "@/lib/types";

export interface HospitalRecommendation {
  hospital: Hospital;
  score: number;
  distanceKm: number;
  reasons: string[];
}

const TYPE_SPECIALIZATION: Record<string, string> = {
  "Road Accident": "Trauma",
  "Heart Problem": "Cardiology",
  "Chest Pain": "Cardiology",
  "Stroke Symptoms": "Neurology",
  "Heavy Bleeding": "Trauma",
  Unconscious: "Emergency Medicine",
  "Breathing Problem": "Emergency Medicine",
  Other: "Emergency Medicine",
};

const DEFAULT_HOSPITALS: Hospital[] = [
  // Tenant 1: MCGM South
  {
    id: "hosp-1",
    tenant_id: "tenant-mcgm-south",
    name: "Bombay Hospital & Medical Research Centre",
    address: "12 Marine Lines, Mumbai South 400020",
    phone: "+91 22 2206 7676",
    latitude: 18.9405,
    longitude: 72.828,
    available_beds: 48,
    icu_beds: 14,
    emergency_available: true,
    specializations: ["Trauma", "Cardiology", "Neurology", "Emergency Medicine"],
    status: "ACTIVE",
  },
  {
    id: "hosp-2",
    tenant_id: "tenant-mcgm-south",
    name: "Breach Candy Hospital Trust",
    address: "60 A Bhulabhai Desai Road, South Mumbai 400026",
    phone: "+91 22 2366 7788",
    latitude: 18.9722,
    longitude: 72.805,
    available_beds: 18,
    icu_beds: 8,
    emergency_available: true,
    specializations: ["Cardiology", "Trauma", "Emergency Medicine", "General Surgery"],
    status: "ACTIVE",
  },
  {
    id: "hosp-3",
    tenant_id: "tenant-mcgm-south",
    name: "Saifee Hospital",
    address: "15/17 Maharshi Karve Road, Charni Road, Mumbai South 400004",
    phone: "+91 22 6757 0111",
    latitude: 18.953,
    longitude: 72.819,
    available_beds: 32,
    icu_beds: 6,
    emergency_available: true,
    specializations: ["Emergency Medicine", "Trauma", "General Surgery", "Cardiology"],
    status: "ACTIVE",
  },
  {
    id: "hosp-4",
    tenant_id: "tenant-mcgm-south",
    name: "Sir H. N. Reliance Foundation Hospital",
    address: "Raja Rammohan Roy Road, Prarthana Samaj, Girgaon, Mumbai 400004",
    phone: "+91 22 6130 5000",
    latitude: 18.9585,
    longitude: 72.8185,
    available_beds: 26,
    icu_beds: 10,
    emergency_available: true,
    specializations: ["Cardiology", "Neurology", "Trauma", "Emergency Medicine"],
    status: "ACTIVE",
  },

  // Tenant 2: Apollo Health Network
  {
    id: "hosp-apollo-1",
    tenant_id: "tenant-apollo-mumbai",
    name: "Apollo Hospitals Navi Mumbai",
    address: "Plot # 13, Off Uran Highway, Sector 23, CBD Belapur, Navi Mumbai 400614",
    phone: "+91 22 6280 6280",
    latitude: 19.0176,
    longitude: 73.018,
    available_beds: 55,
    icu_beds: 18,
    emergency_available: true,
    specializations: ["Cardiology", "Neurology", "Trauma", "Emergency Medicine"],
    status: "ACTIVE",
  },
  {
    id: "hosp-apollo-2",
    tenant_id: "tenant-apollo-mumbai",
    name: "Apollo Speciality Emergency Centre",
    address: "Sector 17, Vashi, Navi Mumbai 400703",
    phone: "+91 22 6698 6666",
    latitude: 19.076,
    longitude: 72.999,
    available_beds: 22,
    icu_beds: 7,
    emergency_available: true,
    specializations: ["Emergency Medicine", "Cardiology", "Trauma"],
    status: "ACTIVE",
  },
  {
    id: "hosp-apollo-3",
    tenant_id: "tenant-apollo-mumbai",
    name: "Apollo Clinic Colaba Emergency Outpost",
    address: "14 Battery Street, Apollo Bunder, Colaba, Mumbai 400001",
    phone: "+91 22 2282 0404",
    latitude: 18.922,
    longitude: 72.834,
    available_beds: 12,
    icu_beds: 4,
    emergency_available: true,
    specializations: ["Emergency Medicine", "General Surgery"],
    status: "ACTIVE",
  },

  // Tenant 3: Fortis Critical Care Fleet
  {
    id: "hosp-fortis-1",
    tenant_id: "tenant-fortis-metro",
    name: "Fortis Hospital Mulund (Level 1 Trauma)",
    address: "Mulund Goregaon Link Rd, Industrial Area, Bhandup West, Mumbai 400078",
    phone: "+91 22 6799 4444",
    latitude: 19.1726,
    longitude: 72.9565,
    available_beds: 60,
    icu_beds: 20,
    emergency_available: true,
    specializations: ["Cardiology", "Trauma", "Neurology", "Emergency Medicine"],
    status: "ACTIVE",
  },
  {
    id: "hosp-fortis-2",
    tenant_id: "tenant-fortis-metro",
    name: "Fortis Hiranandani Hospital Vashi",
    address: "Mini Sea Shore Road, Sector 10A, Vashi, Navi Mumbai 400703",
    phone: "+91 22 3919 9222",
    latitude: 19.083,
    longitude: 73.001,
    available_beds: 28,
    icu_beds: 9,
    emergency_available: true,
    specializations: ["Cardiology", "Emergency Medicine", "Trauma"],
    status: "ACTIVE",
  },

  // Tenant 4: Max & Nanavati Suburban Trauma
  {
    id: "hosp-max-1",
    tenant_id: "tenant-max-suburban",
    name: "Nanavati Max Super Speciality Hospital",
    address: "Swami Vivekanand Rd, LIC Colony, Suresh Colony, Vile Parle West, Mumbai 400056",
    phone: "+91 22 2626 7500",
    latitude: 19.0968,
    longitude: 72.8415,
    available_beds: 70,
    icu_beds: 22,
    emergency_available: true,
    specializations: ["Trauma", "Neurology", "Cardiology", "Emergency Medicine"],
    status: "ACTIVE",
  },
  {
    id: "hosp-max-2",
    tenant_id: "tenant-max-suburban",
    name: "Lilavati Hospital and Research Centre",
    address:
      "A-791, Bandra Reclamation Rd, General Arunkumar Vaidya Nagar, Bandra West, Mumbai 400050",
    phone: "+91 22 2675 1000",
    latitude: 19.0512,
    longitude: 72.8294,
    available_beds: 45,
    icu_beds: 15,
    emergency_available: true,
    specializations: ["Cardiology", "Emergency Medicine", "Neurology", "Trauma"],
    status: "ACTIVE",
  },
  {
    id: "hosp-max-3",
    tenant_id: "tenant-max-suburban",
    name: "P. D. Hinduja Healthcare Surgical",
    address: "11th Rd, Khar, Khar West, Mumbai 400052",
    phone: "+91 22 6154 7000",
    latitude: 19.072,
    longitude: 72.836,
    available_beds: 19,
    icu_beds: 5,
    emergency_available: true,
    specializations: ["Emergency Medicine", "General Surgery", "Cardiology"],
    status: "ACTIVE",
  },
];

let seededHospitals = false;
async function seedDefaultHospitalsIfEmpty() {
  if (seededHospitals) return;
  try {
    const snap = await getDocs(query(collection(db, "hospitals"), limit(1)));
    if (snap.empty) {
      for (const h of DEFAULT_HOSPITALS) {
        await setDoc(doc(db, "hospitals", h.id), h);
      }
    }
    seededHospitals = true;
  } catch (err) {
    console.warn("Could not seed hospitals in Firestore:", err);
  }
}

export function requiredSpecialization(emergencyType: string): string {
  return TYPE_SPECIALIZATION[emergencyType] ?? "Emergency Medicine";
}

export async function listHospitals(tenantId?: string): Promise<Hospital[]> {
  await seedDefaultHospitalsIfEmpty();
  try {
    const snap = await getDocs(query(collection(db, "hospitals"), orderBy("name")));
    if (snap.empty) {
      if (tenantId) {
        return DEFAULT_HOSPITALS.filter((h) => h.tenant_id === tenantId);
      }
      return DEFAULT_HOSPITALS;
    }
    const results = snap.docs.map((d) => d.data() as Hospital);
    if (tenantId) {
      return results.filter((h) => !h.tenant_id || h.tenant_id === tenantId);
    }
    return results;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, "hospitals");
    } catch {
      if (tenantId) {
        return DEFAULT_HOSPITALS.filter((h) => h.tenant_id === tenantId);
      }
      return DEFAULT_HOSPITALS;
    }
    if (tenantId) {
      return DEFAULT_HOSPITALS.filter((h) => h.tenant_id === tenantId);
    }
    return DEFAULT_HOSPITALS;
  }
}

/** Suitability scoring — distance is only one input. */
export function rankHospitals(
  hospitals: Hospital[],
  location: LatLng,
  emergencyType: string,
  priority: Priority,
): HospitalRecommendation[] {
  const spec = requiredSpecialization(emergencyType);
  const needsIcu = priority === "CRITICAL" || priority === "HIGH";

  return hospitals
    .map((h) => {
      const km = distanceKm(location, h);
      const reasons: string[] = [];
      let score = 100;

      score -= Math.min(40, km * 4.5);
      reasons.push(`${km.toFixed(1)} km travel distance`);

      if (h.emergency_available) {
        score += 18;
        reasons.push("Emergency department accepting patients");
      } else {
        score -= 55;
        reasons.push("Emergency department unavailable");
      }

      if (h.specializations.includes(spec)) {
        score += 20;
        reasons.push(`${spec} specialisation available`);
      } else {
        score -= 12;
        reasons.push(`No dedicated ${spec} unit`);
      }

      if (needsIcu) {
        if (h.icu_beds > 0) {
          score += 22 + Math.min(8, h.icu_beds);
          reasons.push(`${h.icu_beds} ICU bed(s) free`);
        } else {
          score -= 45;
          reasons.push("No ICU capacity");
        }
      }

      if (h.available_beds > 0) {
        score += Math.min(10, h.available_beds / 4);
        reasons.push(`${h.available_beds} general bed(s) free`);
      } else {
        score -= 30;
        reasons.push("No general beds free");
      }

      if (h.status !== "ACTIVE") score -= 60;

      return { hospital: h, score: Math.round(score), distanceKm: km, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export const hospitalRecommendationService = {
  listHospitals,
  rankHospitals,
  requiredSpecialization,
};
