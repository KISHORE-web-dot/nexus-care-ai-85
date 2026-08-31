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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import type { Tenant } from "@/lib/types";

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: "tenant-mcgm-south",
    name: "Brihanmumbai EMS — South Zone",
    slug: "mcgm-south",
    code: "MCGM-S",
    region: "Mumbai South (Marine Drive, Colaba, Byculla)",
    hotline: "108 / +91 22 2262 0111",
    center_latitude: 18.9388,
    center_longitude: 72.8311,
    zoom: 13,
    status: "ACTIVE",
    tier: "MUNICIPAL",
    badge_color: "emerald",
    description: "Municipal emergency response and public trauma network for South Mumbai.",
    total_ambulances: 4,
    total_hospitals: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "tenant-apollo-mumbai",
    name: "Apollo Emergency & Trauma Network",
    slug: "apollo-mumbai",
    code: "APOLLO-MUM",
    region: "Navi Mumbai & Belapur Trauma Corridor",
    hotline: "+91 22 6698 6666 / 1066",
    center_latitude: 19.0176,
    center_longitude: 73.018,
    zoom: 13,
    status: "ACTIVE",
    tier: "HOSPITAL_NETWORK",
    badge_color: "blue",
    description: "Private multispecialty network with dedicated cardiac ICU ambulances.",
    total_ambulances: 3,
    total_hospitals: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "tenant-fortis-metro",
    name: "Fortis Critical Care & Air-Surface Fleet",
    slug: "fortis-metro",
    code: "FORTIS-CC",
    region: "Central Mumbai & Thane (Mulund, Vashi)",
    hotline: "+91 22 6799 4444 / 105010",
    center_latitude: 19.1726,
    center_longitude: 72.9565,
    zoom: 13,
    status: "ACTIVE",
    tier: "HOSPITAL_NETWORK",
    badge_color: "amber",
    description: "High-acuity stroke and cardiac arrest rescue consortium with rapid ALS response.",
    total_ambulances: 3,
    total_hospitals: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "tenant-max-suburban",
    name: "Max & Nanavati Regional Trauma Services",
    slug: "max-suburban",
    code: "MAX-SUBURB",
    region: "Western Suburban Mumbai (Bandra, Vile Parle)",
    hotline: "+91 22 2626 7500 / 102",
    center_latitude: 19.0596,
    center_longitude: 72.8295,
    zoom: 13,
    status: "ACTIVE",
    tier: "ENTERPRISE",
    badge_color: "purple",
    description: "Suburban level-1 trauma facilities with advanced mobile resuscitation units.",
    total_ambulances: 3,
    total_hospitals: 3,
    created_at: new Date().toISOString(),
  },
];

let seeded = false;

export async function seedTenantsIfEmpty(): Promise<Tenant[]> {
  if (seeded) return DEFAULT_TENANTS;
  try {
    const q = query(collection(db, "tenants"), limit(10));
    const snap = await getDocs(q);
    if (!snap.empty) {
      seeded = true;
      return snap.docs.map((d) => d.data() as Tenant);
    }
    // Only attempt seed writes if user is authenticated (prevents permission errors on public load)
    if (auth.currentUser) {
      for (const tenant of DEFAULT_TENANTS) {
        await setDoc(doc(db, "tenants", tenant.id), tenant);
      }
    }
    seeded = true;
    return DEFAULT_TENANTS;
  } catch (error) {
    console.warn("Could not check/seed tenants in Firestore:", error);
    return DEFAULT_TENANTS;
  }
}

export async function listTenants(): Promise<Tenant[]> {
  try {
    const q = query(collection(db, "tenants"), orderBy("name", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      return await seedTenantsIfEmpty();
    }
    return snap.docs.map((d) => d.data() as Tenant);
  } catch (error) {
    console.warn("Could not load tenants list from Firestore, using default tenants:", error);
    return DEFAULT_TENANTS;
  }
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const snap = await getDoc(doc(db, "tenants", tenantId));
    if (snap.exists()) {
      return snap.data() as Tenant;
    }
    return DEFAULT_TENANTS.find((t) => t.id === tenantId) || null;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, `tenants/${tenantId}`);
    } catch {
      return DEFAULT_TENANTS.find((t) => t.id === tenantId) || null;
    }
    return DEFAULT_TENANTS.find((t) => t.id === tenantId) || null;
  }
}

export async function createTenant(
  tenantData: Omit<Tenant, "id"> & { id?: string },
): Promise<Tenant> {
  const id = tenantData.id || `tenant-${tenantData.slug || Date.now()}`;
  const fullTenant: Tenant = {
    ...tenantData,
    id,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "tenants", id), fullTenant);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tenants/${id}`);
  }
  return fullTenant;
}

export async function updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<void> {
  try {
    await updateDoc(doc(db, "tenants", tenantId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
  }
}
