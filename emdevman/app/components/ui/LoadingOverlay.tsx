"use client";

import {
  useSyncExternalStore,
  useEffect,
  useRef,
  useState,
} from "react";

/*
  Page-load overlay. Mounted once in the root layout, so it does not come back on
  client-side route changes - that is what "applied when opening the page" means
  here.

  While it is up, it also runs a small network hygiene pass:
    - detects a true offline state (navigator.onLine on + offline events) and
      shows "You are offline"
    - probes the visitor's downlink by measuring the boot animation download and
      by reading the Network Information API (navigator.connection). If the link
      is neither offline nor below 1MB of effective throughput, nothing extra
      is shown; otherwise "Your internet is slow" is shown.
  The probe is best-effort and never blocks dismissal.
*/

const MIN_DURATION_MS = 3000;
const FADE_MS = 360;
// Below this effective throughput (megabits/sec) we declare "slow".
const SLOW_DOWNLINK_MBPS = 1;
// Below this measured download of the 291KB boot asset, also "slow".
const SLOW_DOWNLOAD_MS = 2500;

type NetBand = "checking" | "ok" | "slow" | "offline";
type NetInfo = { band: NetBand; rttMs: number | null; downlinkMbps: number | null };

function useReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", callback);
      return () => query.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

type Phase = "visible" | "leaving" | "gone";

export default function LoadingOverlay() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("visible");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const [net, setNet] = useState<NetInfo>({ band: "checking", rttMs: null, downlinkMbps: null });
  const mountedAtRef = useRef(0);

  // --- network hygiene -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const classifyFromConnection = () => {
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; addEventListener?: (e: string, h: () => void) => void; removeEventListener?: (e: string, h: () => void) => void; } }).connection;
      const downlink = typeof conn?.downlink === "number" ? conn.downlink : null;
      const effectiveType = conn?.effectiveType ?? null;
      const slowByDownlink = downlink !== null && downlink < SLOW_DOWNLINK_MBPS;
      const slowByType = effectiveType === "slow-2g" || effectiveType === "2g";
      if (!navigator.onLine) return { downlink, slow: true, offline: true } as const;
      return { downlink, slow: slowByDownlink || slowByType, offline: false } as const;
    };

    const applyOffline = () => setNet({ band: "offline", rttMs: null, downlinkMbps: null });
    const applySlow = (rttMs: number | null, downlinkMbps: number | null) =>
      setNet({ band: "slow", rttMs, downlinkMbps });
    const applyOk = (rttMs: number | null, downlinkMbps: number | null) =>
      setNet({ band: "ok", rttMs, downlinkMbps });

    // Instant read from Network Information API, if present.
    const initial = classifyFromConnection();
    if (initial.offline) applyOffline();
    else if (initial.slow) applySlow(null, initial.downlink);

    // Live online/offline events.
    const handleOnline = () => {
      const c = classifyFromConnection();
      if (c.slow) applySlow(null, c.downlink);
      else applyOk(null, c.downlink);
    };
    const handleOffline = () => applyOffline();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const conn = (navigator as Navigator & { connection?: { addEventListener?: (e: string, h: () => void) => void; } }).connection;
    const handleConnChange = () => {
      if (cancelled) return;
      const c = classifyFromConnection();
      if (c.offline) applyOffline();
      else if (c.slow) applySlow(null, c.downlink);
      else applyOk(null, c.downlink);
    };
    if (conn) conn.addEventListener?.("change", handleConnChange);

    // Measured probe: time the fetch of the boot animation asset. Its timing
    // entry gives both a latency (TTFB-ish) estimate and a real throughput.
    (async () => {
      try {
        const url = "/images/boot.gif?probe=" + Date.now();
        const t0 = performance.now();
        // First try HEAD to avoid pulling duplicate.
        let fetchOk = true;
        try {
          const resp = await fetch(url, { cache: "no-store" });
          if (!resp.ok) fetchOk = false;
          // Drain a small slice to ensure transfer completes; cap memory.
          await resp.blob();
        } catch {
          fetchOk = false;
        }
        if (cancelled) return;
        const t1 = performance.now();
        const elapsed = t1 - t0;

        // Resource timing entry (best effort).
        let rtt: number | null = null;
        let throughput: number | null = null;
        try {
          const entries = performance.getEntriesByName(url);
          const res = entries && entries.length ? (entries[0] as PerformanceResourceTiming) : null;
          if (res) {
            const e = res;
            rtt = e.responseStart && e.requestStart ? e.responseStart - e.requestStart : null;
            const transferBytes = e.transferSize || 0;
            const durationS = (e.responseEnd - e.startTime) / 1000;
            if (transferBytes > 0 && durationS > 0) throughput = (transferBytes * 8) / durationS / 1_000_000; // Mbps
          }
        } catch {
          /* ignore */
        }

        if (!navigator.onLine || !fetchOk) {
          applyOffline();
          return;
        }
        const slowByElapsed = elapsed > SLOW_DOWNLOAD_MS;
        const slowByThroughput = throughput !== null && throughput < SLOW_DOWNLINK_MBPS;
        const slowByDownlink =
          classifyFromConnection().downlink !== null &&
          (classifyFromConnection().downlink as number) < SLOW_DOWNLINK_MBPS;

        if (slowByElapsed || slowByThroughput || slowByDownlink) {
          applySlow(rtt, throughput ?? classifyFromConnection().downlink);
        } else {
          applyOk(rtt, throughput ?? classifyFromConnection().downlink);
        }
      } catch {
        if (cancelled) return;
        if (!navigator.onLine) applyOffline();
        else applySlow(null, null);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn) (conn as { removeEventListener?: (e: string, h: () => void) => void }).removeEventListener?.("change", handleConnChange);
    };
  }, []);

  // --- dismissal hygiene (reliable 3s minimum in case a one-shot timer races) ---
  useEffect(() => {
    mountedAtRef.current = Date.now();
    let cancelled = false;
    let done = false;

    const intervalId = window.setInterval(() => {
      if (cancelled || done) return;
      const elapsed = Date.now() - mountedAtRef.current;
      setElapsedTenths(Math.round(elapsed / 100));
      if (elapsed < MIN_DURATION_MS) return;
      done = true;
      setPhase("leaving");
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("gone");
      }, reduce ? 0 : FADE_MS);
      window.clearInterval(intervalId);
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [reduce]);

  // Lock body scroll while the overlay is up; restore when it leaves.
  useEffect(() => {
    if (phase === "gone") {
      document.body.style.overflow = "";
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  if (phase === "gone") return null;

  const leaving = phase === "leaving";
  const transition = reduce ? "none" : `opacity ${FADE_MS}ms ease-out`;

  const netLabel =
    net.band === "offline"
      ? "You are offline"
      : net.band === "slow"
        ? "Your internet is slow"
        : net.band === "checking"
          ? "Checking connection…"
          : undefined;

  const netDanger = net.band === "offline" || net.band === "slow";
  const netSecondary =
    net.band === "ok"
      ? net.rttMs !== null
        ? `RTT ${Math.round(net.rttMs)} ms` +
          (net.downlinkMbps !== null ? ` · ${net.downlinkMbps.toFixed(1)} Mbps` : "")
        : net.downlinkMbps !== null
          ? `${net.downlinkMbps.toFixed(1)} Mbps`
          : undefined
      : net.band === "slow" && net.rttMs !== null
        ? `RTT ${Math.round(net.rttMs)} ms`
        : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      data-loading-overlay=""
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        backgroundColor: "var(--overlay-backdrop)",
        backdropFilter: "blur(2px)",
        opacity: leaving ? 0 : 1,
        transition,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "400px",
          maxWidth: "90vw",
          aspectRatio: "400 / 170",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reduce ? "/images/boot-poster.png" : "/images/boot.gif"}
          alt=""
          width={400}
          height={170}
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%",
            height: "auto",
            opacity: 1,
          }}
        />
        {!reduce && !imgLoaded ? (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 34,
              height: 34,
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent-a)",
              borderRadius: "50%",
              animation: "loading-overlay-spin 0.9s linear infinite",
            }}
          />
        ) : null}
      </div>

      <span
        style={{
          fontSize: "0.9rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--foreground)",
          opacity: 0.78,
        }}
      >
        Loading… ({(elapsedTenths / 10).toFixed(1)}s)
      </span>

      {netLabel ? (
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: netDanger ? "var(--destructive)" : "var(--muted-foreground)",
            opacity: 0.9,
            letterSpacing: "0.02em",
            textTransform: "none",
          }}
          role={netDanger ? "alert" : undefined}
        >
          {netLabel}
        </span>
      ) : null}

      {netSecondary ? (
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--muted-foreground)",
            opacity: 0.7,
            letterSpacing: "0.05em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {netSecondary}
        </span>
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes loading-overlay-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }",
        }}
      />
    </div>
  );
}