import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";
import type { AppRole } from "@/lib/types";

export interface DemoAccount {
  role: AppRole;
  email: string;
  name: string;
  label: string;
}

/** Demo identities used for walkthrough. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "PATIENT",
    email: "patient@demo.emergency.app",
    name: "Anitha Raman",
    label: "Patient Demo",
  },
  { role: "DRIVER", email: "driver@demo.emergency.app", name: "Ravi Kumar", label: "Driver Demo" },
  {
    role: "HOSPITAL",
    email: "hospital@demo.emergency.app",
    name: "Aravind Control Desk",
    label: "Hospital Demo",
  },
  {
    role: "DOCTOR",
    email: "doctor@demo.emergency.app",
    name: "Dr. Meera Nair",
    label: "Doctor Demo",
  },
  {
    role: "ADMIN",
    email: "admin@demo.emergency.app",
    name: "Operations Admin",
    label: "Admin Demo",
  },
];

export async function ensureProfile(
  userId: string,
  name: string,
  email: string,
  phone: string | null,
  role: AppRole,
) {
  const profileRef = doc(db, "profiles", userId);
  try {
    const existing = await getDoc(profileRef);
    if (!existing.exists()) {
      await setDoc(profileRef, {
        id: userId,
        name: name || "User",
        email: email || "",
        phone: phone || "",
        role: role || "PATIENT",
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${userId}`);
  }

  if (role === "PATIENT") {
    const patientRef = doc(db, "patients", userId);
    try {
      const patientDoc = await getDoc(patientRef);
      if (!patientDoc.exists()) {
        await setDoc(patientRef, {
          id: userId,
          user_id: userId,
          name: name || "Patient",
          phone: phone || "",
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${userId}`);
    }
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
  fallbackRole: AppRole = "PATIENT",
) {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = result.user;
    if (user) {
      await ensureProfile(
        user.uid,
        user.displayName || email.split("@")[0] || "User",
        user.email || email,
        user.phoneNumber || null,
        fallbackRole,
      );
    }
    return user;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "auth/operation-not-allowed") {
      // Firebase project has not enabled Email/Password provider in console.
      // Gracefully fall back to local authenticated session so manual testing is never blocked.
      const sanitized = email
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 24);
      const localId = `local_${sanitized || "user"}`;
      const demoMatch = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
      );
      const role = demoMatch ? demoMatch.role : fallbackRole;
      const displayName = demoMatch ? demoMatch.label : email.split("@")[0] || "User";

      localStorage.setItem(
        "demo_auth_user",
        JSON.stringify({
          uid: localId,
          email: email.trim(),
          displayName,
          role,
        }),
      );
      window.dispatchEvent(new Event("demo-auth-changed"));
      return {
        uid: localId,
        email: email.trim(),
        displayName,
        role,
        isLocalFallback: true,
      };
    }
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  selectedRole: AppRole = "PATIENT",
  name?: string,
) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = result.user;
    if (user) {
      const displayName = name?.trim() || email.split("@")[0] || "User";
      await ensureProfile(
        user.uid,
        displayName,
        user.email || email,
        user.phoneNumber || null,
        selectedRole,
      );
    }
    return user;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "auth/operation-not-allowed") {
      // Firebase project has not enabled Email/Password provider in console.
      // Gracefully fall back to local authenticated session so manual testing is never blocked.
      const sanitized = email
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 24);
      const localId = `local_${sanitized || "user"}`;
      const displayName = name?.trim() || email.split("@")[0] || "User";

      localStorage.setItem(
        "demo_auth_user",
        JSON.stringify({
          uid: localId,
          email: email.trim(),
          displayName,
          role: selectedRole,
        }),
      );
      window.dispatchEvent(new Event("demo-auth-changed"));
      return {
        uid: localId,
        email: email.trim(),
        displayName,
        role: selectedRole,
        isLocalFallback: true,
      };
    }
    throw error;
  }
}

export function formatAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account already exists with this email address. Please sign in instead.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/operation-not-allowed":
        return "Email/password authentication is not enabled in Firebase.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completing.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      default:
        break;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Authentication failed. Please check your credentials.";
}

export async function signInWithGoogle(selectedRole: AppRole = "PATIENT") {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (user) {
    await ensureProfile(
      user.uid,
      user.displayName || "Google User",
      user.email || "",
      user.phoneNumber || null,
      selectedRole,
    );
  }
  return user;
}

export async function signInDemo(account: DemoAccount) {
  // Store active demo profile for interactive preview
  const demoUserId = `demo-${account.role.toLowerCase()}`;
  localStorage.setItem(
    "demo_auth_user",
    JSON.stringify({
      uid: demoUserId,
      email: account.email,
      displayName: account.name,
      role: account.role,
    }),
  );
  window.dispatchEvent(new Event("demo-auth-changed"));
  return {
    uid: demoUserId,
    email: account.email,
    displayName: account.name,
    role: account.role,
  };
}

export async function signOut() {
  localStorage.removeItem("demo_auth_user");
  window.dispatchEvent(new Event("demo-auth-changed"));
  await firebaseSignOut(auth);
}

export async function fetchRole(userId: string): Promise<AppRole | null> {
  try {
    const snap = await getDoc(doc(db, "profiles", userId));
    if (snap.exists()) {
      return (snap.data()?.["role"] as AppRole) ?? null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `profiles/${userId}`);
  }
}

export const authService = {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInDemo,
  signOut,
  fetchRole,
  ensureProfile,
  formatAuthErrorMessage,
  DEMO_ACCOUNTS,
};
