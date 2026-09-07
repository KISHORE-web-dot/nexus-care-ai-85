import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("app_theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app_theme", "light");
    }
  }, [isDark]);

  return (
    <Button
      id="btn-theme-toggle"
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-slate-700 dark:text-slate-200 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}
