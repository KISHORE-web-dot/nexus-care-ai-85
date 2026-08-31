import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Heart,
  Mail,
  Phone,
  Save,
  Shield,
  Stethoscope,
  User,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { doc, setDoc } from "firebase/firestore";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePatientProfile } from "@/hooks/useEmergencyData";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import type { AppRole } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "User Profile & Medical ID — SmartResponse" },
      {
        name: "description",
        content:
          "Manage your personal information, emergency contacts, and vital medical emergency card.",
      },
      { property: "og:title", content: "User Profile & Medical ID — SmartResponse" },
      {
        property: "og:description",
        content: "Medical details and emergency response contact configuration.",
      },
    ],
  }),
  component: ProfilePage,
});

const ROLES: { role: AppRole; title: string; desc: string }[] = [
  { role: "PATIENT", title: "Patient / Citizen", desc: "Trigger 1-click SOS & track rescue" },
  { role: "DRIVER", title: "Ambulance Driver", desc: "Accept emergency dispatches & navigate" },
  { role: "PARAMEDIC", title: "Paramedic / EMT", desc: "Live vitals & onboard patient care" },
  { role: "HOSPITAL", title: "Hospital Command", desc: "Manage bed & ICU emergency capacity" },
  { role: "DOCTOR", title: "ER Physician", desc: "Review incoming triage & patient vitals" },
  { role: "ADMIN", title: "System Admin", desc: "Fleet operations & network analytics" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

function ProfilePage() {
  const { user, role, name, email, phone, setRole, setUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = usePatientProfile(user?.id);

  const [formData, setFormData] = useState({
    name: name || "",
    phone: phone || "+91 98200 88990",
    age: "32",
    gender: "Male",
    blood_group: "O+",
    emergency_contact_name: "Pooja Isaac",
    emergency_contact: "+91 98200 11999",
    medical_history: "Mild asthma, penicillin allergy",
    allergies: "Penicillin, NSAIDs",
    address: "Marine Drive, Churchgate, Mumbai 400020",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || prev.name,
        phone: profile.phone || prev.phone,
        age: profile.age ? String(profile.age) : prev.age,
        gender: profile.gender || prev.gender,
        blood_group: profile.blood_group || prev.blood_group,
        emergency_contact: profile.emergency_contact || prev.emergency_contact,
        medical_history: profile.medical_history || prev.medical_history,
        allergies: profile.allergies || prev.allergies,
      }));
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: user?.id || "user-current",
        name: formData.name,
        phone: formData.phone,
        age: Number(formData.age) || null,
        gender: formData.gender,
        blood_group: formData.blood_group,
        emergency_contact: formData.emergency_contact,
        emergency_contact_name: formData.emergency_contact_name,
        medical_history: formData.medical_history,
        allergies: formData.allergies,
        address: formData.address,
        updated_at: new Date().toISOString(),
      };

      if (user?.id) {
        try {
          await setDoc(doc(db, "patients", user.id), payload, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPSERT, `patients/${user.id}`);
        }
      }

      // Also save to demo local storage
      const demoUser = localStorage.getItem("demo_auth_user");
      if (demoUser) {
        try {
          const parsed = JSON.parse(demoUser);
          localStorage.setItem(
            "demo_auth_user",
            JSON.stringify({
              ...parsed,
              name: formData.name,
              phone: formData.phone,
            }),
          );
        } catch {
          // ignore
        }
      }

      toast.success("Profile and Emergency Medical Card saved successfully");
      queryClient.invalidateQueries({ queryKey: ["patient", user?.id] });
    } catch (error) {
      toast.success("Profile saved locally");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (newRole: AppRole) => {
    setRole(newRole);
    toast.success(`Active role switched to ${newRole}`);
  };

  return (
    <AppShell title="Profile & Medical ID">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Account & Medical Emergency Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure your contact details, emergency responder medical card, and system simulation
            role.
          </p>
        </div>

        {/* Role Selector Card */}
        <div className="card-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <h3 className="font-semibold text-foreground">Operational Role</h3>
            </div>
            <Badge variant="default" className="text-xs uppercase">
              Current: {role}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Switch your active view to simulate different emergency coordination stakeholders:
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => {
              const active = role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleChange(r.role)}
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card/50 hover:bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{r.title}</span>
                    {active && <CheckCircle2 className="size-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Profile Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Info */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <User className="size-4 text-primary" />
              <h3 className="font-semibold text-foreground">Personal Information</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tony Isaac"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-addr">Email Address</Label>
                <Input
                  id="email-addr"
                  value={email || "tonyisaac543@gmail.com"}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone-number">Mobile Phone</Label>
                <Input
                  id="phone-number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98200 88990"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-address">Primary Address / Landmark</Label>
                <Input
                  id="user-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Marine Drive, Churchgate, Mumbai"
                />
              </div>
            </div>
          </div>

          {/* Medical ID & Emergency Card */}
          <div className="card-surface p-5 space-y-4 border-emergency/20">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-emergency" />
                <h3 className="font-semibold text-foreground">Emergency Medical ID Card</h3>
              </div>
              <span className="text-[11px] font-medium text-emergency flex items-center gap-1">
                <AlertCircle className="size-3" /> Shared with first responders on SOS
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="blood-group">Blood Group</Label>
                <select
                  id="blood-group"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-age">Age</Label>
                <Input
                  id="user-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="32"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-gender">Gender</Label>
                <select
                  id="user-gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Emergency Contact Name</Label>
                <Input
                  id="contact-name"
                  value={formData.emergency_contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact_name: e.target.value })
                  }
                  placeholder="e.g. Next of kin name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Emergency Contact Phone</Label>
                <Input
                  id="contact-phone"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="+91 98200 11999"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="known-allergies">Known Allergies (Crucial for EMS)</Label>
              <Input
                id="known-allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa, Peanuts, Latex"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medical-history">Pre-existing Medical Conditions & Medications</Label>
              <Textarea
                id="medical-history"
                rows={2}
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="e.g. Hypertension, Asthma (uses Inhaler), Type 2 Diabetes"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="submit" disabled={saving} className="min-w-32">
              <Save className="size-4 mr-1.5" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
