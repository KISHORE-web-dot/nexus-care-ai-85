import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const demoUser = typeof window !== "undefined" ? localStorage.getItem("demo_auth_user") : null;
    const currentUser = auth.currentUser;
    if (!currentUser && !demoUser) {
      throw redirect({ to: "/auth" });
    }
    return { user: currentUser || (demoUser ? JSON.parse(demoUser) : null) };
  },
  component: () => <Outlet />,
});
