import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tenant } from "@/lib/types";
import {
  DEFAULT_TENANTS,
  listTenants,
  createTenant as createTenantService,
  updateTenant as updateTenantService,
} from "@/services/tenantService";

interface TenantContextValue {
  activeTenant: Tenant;
  activeTenantId: string;
  tenants: Tenant[];
  isLoading: boolean;
  isAllTenants: boolean;
  switchTenant: (tenantId: string) => void;
  setAllTenantsView: (enabled: boolean) => void;
  createTenant: (data: Omit<Tenant, "id"> & { id?: string }) => Promise<Tenant>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
}

const STORAGE_KEY = "nexuscare_active_tenant_id";
const DEFAULT_TENANT_ID = "tenant-mcgm-south";

const TenantContext = createContext<TenantContextValue>({
  activeTenant: DEFAULT_TENANTS[0],
  activeTenantId: DEFAULT_TENANT_ID,
  tenants: DEFAULT_TENANTS,
  isLoading: false,
  isAllTenants: false,
  switchTenant: () => {},
  setAllTenantsView: () => {},
  createTenant: async () => DEFAULT_TENANTS[0],
  updateTenant: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_TENANT_ID;
    } catch {
      return DEFAULT_TENANT_ID;
    }
  });
  const [isAllTenants, setIsAllTenants] = useState<boolean>(false);

  const { data: tenants = DEFAULT_TENANTS, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: listTenants,
    staleTime: 1000 * 60 * 5,
  });

  const activeTenant: Tenant =
    tenants.find((t) => t.id === activeTenantId) ||
    DEFAULT_TENANTS.find((t) => t.id === activeTenantId) ||
    tenants[0] ||
    DEFAULT_TENANTS[0];

  const switchTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setIsAllTenants(false);
    try {
      localStorage.setItem(STORAGE_KEY, tenantId);
    } catch (e) {
      console.warn("Could not save tenant preference to storage:", e);
    }
    // Invalidate dependent queries so maps and data immediately refresh
    queryClient.invalidateQueries({ queryKey: ["ambulances"] });
    queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    queryClient.invalidateQueries({ queryKey: ["emergencies"] });
    queryClient.invalidateQueries({ queryKey: ["emergency-history"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    window.dispatchEvent(new CustomEvent("tenant-changed", { detail: { tenantId } }));
  };

  const setAllTenantsView = (enabled: boolean) => {
    setIsAllTenants(enabled);
    queryClient.invalidateQueries();
  };

  const createTenant = async (data: Omit<Tenant, "id"> & { id?: string }): Promise<Tenant> => {
    const created = await createTenantService(data);
    await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    switchTenant(created.id);
    return created;
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>): Promise<void> => {
    await updateTenantService(id, updates);
    await queryClient.invalidateQueries({ queryKey: ["tenants"] });
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setActiveTenantId(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        activeTenantId,
        tenants,
        isLoading,
        isAllTenants,
        switchTenant,
        setAllTenantsView,
        createTenant,
        updateTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
