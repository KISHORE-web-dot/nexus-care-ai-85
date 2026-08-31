import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { auth, db } from "@/lib/firebase";
import { authService } from "@/services/authService";
import type { AppRole } from "@/lib/types";

export interface CustomAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: AppRole | null;
}

interface AuthValue {
  user: CustomAuthUser | null;
  role: AppRole | null;
  name: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  role: null,
  name: "",
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [demoUser, setDemoUser] = useState<CustomAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check demo user in localStorage
    const readDemoUser = () => {
      try {
        const saved = localStorage.getItem("demo_auth_user");
        if (saved) {
          setDemoUser(JSON.parse(saved));
        } else {
          setDemoUser(null);
        }
      } catch {
        setDemoUser(null);
      }
    };

    readDemoUser();

    const handleDemoChange = () => {
      readDemoUser();
      queryClient.invalidateQueries();
    };

    window.addEventListener("demo-auth-changed", handleDemoChange);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
      queryClient.invalidateQueries();
    });

    return () => {
      window.removeEventListener("demo-auth-changed", handleDemoChange);
      unsubscribe();
    };
  }, [queryClient]);

  const activeUserId = firebaseUser?.uid || demoUser?.uid;

  const { data: profile } = useQuery({
    queryKey: ["auth-profile", activeUserId],
    enabled: !!activeUserId,
    queryFn: async () => {
      if (demoUser && activeUserId === demoUser.uid) {
        return { role: demoUser.role, name: demoUser.displayName || "Demo User" };
      }
      if (!activeUserId) return null;
      try {
        const snap = await getDoc(doc(db, "profiles", activeUserId));
        if (snap.exists()) {
          const data = snap.data();
          return {
            role: (data["role"] as AppRole) ?? null,
            name: (data["name"] as string) ?? firebaseUser?.displayName ?? "User",
          };
        }
      } catch (err) {
        console.warn("Could not fetch user profile:", err);
      }
      return {
        role: "PATIENT" as AppRole,
        name: firebaseUser?.displayName || "User",
      };
    },
  });

  const currentUser: CustomAuthUser | null = firebaseUser
    ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: profile?.role ?? null,
      }
    : demoUser;

  const value: AuthValue = {
    user: currentUser,
    role: profile?.role ?? currentUser?.role ?? null,
    name: profile?.name || currentUser?.displayName || "User",
    loading,
    signOut: async () => {
      await authService.signOut();
      setDemoUser(null);
      setFirebaseUser(null);
      await queryClient.cancelQueries();
      queryClient.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
