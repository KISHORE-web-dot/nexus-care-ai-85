/**
 * SOSButton — Large press-and-hold SOS activation button.
 *
 * 1-second hold to activate. Visual ring fill shows progress.
 * Releasing early cancels. Keyboard accessible (Space/Enter).
 * Protected against accidental taps while still being fast.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onActivate: () => void;
  disabled?: boolean;
}

const HOLD_MS = 1000;

export function SOSButton({ onActivate, disabled = false }: Props) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const firedRef = useRef(false);

  // ── Animation loop ────────────────────────────────────────────────────────

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(elapsed / HOLD_MS, 1);
    setProgress(pct);

    if (pct >= 1 && !firedRef.current) {
      firedRef.current = true;
      setHolding(false);
      setProgress(0);
      onActivate();
      return;
    }
    if (pct < 1) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [onActivate]);

  // ── Start / stop ─────────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (disabled) return;
    firedRef.current = false;
    startRef.current = Date.now();
    setHolding(true);
    setProgress(0);
    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setHolding(false);
    setProgress(0);
  }, []);

  // Cleanup
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ── SVG ring parameters ───────────────────────────────────────────────────

  const RADIUS = 72;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* SOS button */}
      <button
        type="button"
        disabled={disabled}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            stop();
          }
        }}
        aria-label="Press and hold for 1 second to activate emergency SOS"
        role="button"
        className={cn(
          "relative grid size-44 place-items-center rounded-full transition-all select-none touch-none",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emergency/50 focus-visible:ring-offset-4",
          disabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer active:scale-95",
          holding
            ? "bg-emergency shadow-[0_0_40px_rgba(239,68,68,.5)]"
            : "bg-emergency/90 hover:bg-emergency hover:shadow-[0_0_30px_rgba(239,68,68,.35)]",
        )}
      >
        {/* Animated ring */}
        <svg
          className="pointer-events-none absolute inset-0 -rotate-90"
          viewBox="0 0 160 160"
          aria-hidden
        >
          {/* Track */}
          <circle
            cx="80" cy="80" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
          />
          {/* Fill ring */}
          <circle
            cx="80" cy="80" r={RADIUS}
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-none"
          />
        </svg>

        {/* Label */}
        <span className="relative z-10 text-5xl font-black tracking-wider text-white">
          SOS
        </span>
      </button>

      {/* Instructions */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {holding ? "Keep holding…" : "Press and hold to activate"}
        </p>
        <p className="text-xs text-muted-foreground">
          Hold the SOS button for 1 second to request emergency assistance
        </p>
      </div>
    </div>
  );
}

