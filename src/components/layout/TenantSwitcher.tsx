import { useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Layers,
  MapPin,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/useTenant";
import type { TenantTier } from "@/lib/types";
import { toast } from "sonner";

export function TenantSwitcher({ className }: { className?: string }) {
  const {
    activeTenant,
    activeTenantId,
    tenants,
    isAllTenants,
    switchTenant,
    setAllTenantsView,
    createTenant,
  } = useTenant();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    code: "",
    region: "",
    hotline: "",
    tier: "HOSPITAL_NETWORK" as TenantTier,
    center_latitude: 19.076,
    center_longitude: 72.8777,
    description: "",
  });
  const [creating, setCreating] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.region.trim()) {
      toast.error("Please fill in Organization Name and Region");
      return;
    }

    setCreating(true);
    try {
      const slug =
        formData.slug.trim().toLowerCase() ||
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
      const code =
        formData.code.trim().toUpperCase() ||
        formData.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 6)
          .toUpperCase();

      await createTenant({
        id: `tenant-${slug}`,
        name: formData.name.trim(),
        slug,
        code,
        region: formData.region.trim(),
        hotline: formData.hotline.trim() || "108 / Emergency Dispatch",
        tier: formData.tier,
        center_latitude: Number(formData.center_latitude) || 19.076,
        center_longitude: Number(formData.center_longitude) || 72.8777,
        zoom: 13,
        status: "ACTIVE",
        badge_color:
          formData.tier === "MUNICIPAL"
            ? "emerald"
            : formData.tier === "ENTERPRISE"
              ? "purple"
              : "blue",
        description: formData.description.trim() || `${formData.name} Emergency Services`,
      });

      toast.success(`Organization "${formData.name}" provisioned successfully`);
      setDialogOpen(false);
      setFormData({
        name: "",
        slug: "",
        code: "",
        region: "",
        hotline: "",
        tier: "HOSPITAL_NETWORK",
        center_latitude: 19.076,
        center_longitude: 72.8777,
        description: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to provision organization");
    } finally {
      setCreating(false);
    }
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case "MUNICIPAL":
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            Municipal EMS
          </Badge>
        );
      case "ENTERPRISE":
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20"
          >
            Enterprise Trauma
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20"
          >
            Hospital Network
          </Badge>
        );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            id="tenant-switcher-trigger"
            aria-label="Switch organization or municipal EMS zone"
            className={`flex items-center gap-2.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-left transition-all hover:bg-accent/60 hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20 ${className || ""}`}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              {isAllTenants ? <Layers className="size-4" /> : <Building2 className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-semibold text-foreground">
                  {isAllTenants
                    ? "All Healthcare Networks"
                    : activeTenant?.name || "Select Network"}
                </p>
              </div>
              <p className="truncate text-[10px] text-muted-foreground">
                {isAllTenants ? "Cross-Zone Aggregate" : activeTenant?.region || "Active Tenant"}
              </p>
            </div>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-80 p-1.5 shadow-xl">
          <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
            <span>Healthcare Organizations & EMS Zones</span>
            <span className="text-[10px] font-mono font-normal">{tenants.length} Networks</span>
          </DropdownMenuLabel>

          <DropdownMenuGroup className="space-y-0.5">
            {tenants.map((tenant) => {
              const isSelected = !isAllTenants && tenant.id === activeTenantId;
              return (
                <DropdownMenuItem
                  key={tenant.id}
                  id={`tenant-option-${tenant.slug}`}
                  onClick={() => switchTenant(tenant.id)}
                  className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-colors ${
                    isSelected ? "bg-accent text-accent-foreground font-medium" : ""
                  }`}
                >
                  <Building2
                    className={`mt-0.5 size-4 shrink-0 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-semibold">{tenant.name}</p>
                      {getTierBadge(tenant.tier)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="size-3 shrink-0" />
                        {tenant.region}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-mono">
                      <Phone className="size-2.5 shrink-0 text-emergency" />
                      {tenant.hotline}
                    </div>
                  </div>
                  {isSelected && <Check className="mt-0.5 size-4 shrink-0 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            id="tenant-option-all"
            onClick={() => setAllTenantsView(!isAllTenants)}
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 cursor-pointer text-xs ${
              isAllTenants ? "bg-accent text-accent-foreground font-medium" : ""
            }`}
          >
            <Layers className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">All Networks (Cross-Tenant View)</p>
              <p className="text-[10px] text-muted-foreground">
                Aggregate all zones and hospital systems
              </p>
            </div>
            {isAllTenants && <Check className="size-4 shrink-0 text-primary" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            id="tenant-option-new"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 cursor-pointer text-xs text-primary font-medium hover:bg-primary/10"
          >
            <Plus className="size-4 shrink-0" />
            <span>Provision New Healthcare Tenant</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Provision New Tenant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-5 text-primary" />
                Provision Healthcare Tenant
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure a new hospital network, EMS division, or municipal trauma zone with
                isolated dispatch routing.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="tenant-name" className="text-xs font-semibold">
                  Organization / System Name *
                </Label>
                <Input
                  id="tenant-name"
                  placeholder="e.g. Kokilaben Dhirubhai Ambani Trauma Network"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-region" className="text-xs font-semibold">
                    Service Region / Zone *
                  </Label>
                  <Input
                    id="tenant-region"
                    placeholder="e.g. Andheri West & Juhu"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-tier" className="text-xs font-semibold">
                    Organization Tier
                  </Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(val: TenantTier) => setFormData({ ...formData, tier: val })}
                  >
                    <SelectTrigger id="tenant-tier">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MUNICIPAL">Municipal EMS (108)</SelectItem>
                      <SelectItem value="HOSPITAL_NETWORK">Hospital Network</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise Trauma System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-hotline" className="text-xs font-semibold">
                    Emergency Hotline
                  </Label>
                  <Input
                    id="tenant-hotline"
                    placeholder="e.g. +91 22 4269 9999"
                    value={formData.hotline}
                    onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-slug" className="text-xs font-semibold">
                    Tenant Slug
                  </Label>
                  <Input
                    id="tenant-slug"
                    placeholder="e.g. kda-andheri"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-lat" className="text-xs font-semibold">
                    Center Latitude
                  </Label>
                  <Input
                    id="tenant-lat"
                    type="number"
                    step="0.0001"
                    value={formData.center_latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, center_latitude: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-lng" className="text-xs font-semibold">
                    Center Longitude
                  </Label>
                  <Input
                    id="tenant-lng"
                    type="number"
                    step="0.0001"
                    value={formData.center_longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        center_longitude: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Provisioning..." : "Provision Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
