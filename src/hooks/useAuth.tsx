import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/types";

interface AuthValue {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  name: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  role: null,
  name: "",
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;

  const { data: profile } = useQuery({
    queryKey: ["auth-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId!).limit(1).maybeSingle(),
        supabase.from("profiles").select("name").eq("id", userId!).maybeSingle(),
      ]);
      return {
        role: ((roleRow as { role: AppRole } | null)?.role ?? null) as AppRole | null,
        name: (profileRow as { name: string } | null)?.name ?? "",
      };
    },
  });

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    role: profile?.role ?? ((session?.user.user_metadata?.["role"] as AppRole) ?? null),
    name: profile?.name || ((session?.user.user_metadata?.["name"] as string) ?? "User"),
    loading,
    signOut: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
