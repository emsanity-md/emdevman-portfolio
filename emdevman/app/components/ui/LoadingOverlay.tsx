"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
  The page-load overlay, and the network diagnostic that runs alongside it.

  Mounted once in the root layout, so it does not come back on client-side
  route changes - that is what "applied when opening the page" means here.

  ---------------------------------------------------------------------------
  The measurement
  ---------------------------------------------------------------------------

  Three independent signals, because each one lies in a different way:

    1. A round trip to /api/ping. This is the only one that measures the
       visitor's actual path to this origin, so it is the primary. The server
       reports its own processing time in `Server-Timing` and the client
       subtracts it, so what is shown is the network's share rather than the
       round trip to a function that returns immediately.

    2. The Navigation Timing entry for the page itself. The browser already
       measured it to render the page, so it costs nothing - but it is a
       single sample from a moment when the network was also busy delivering
       the rest of the site, so it is a lower bound, not a measurement.

    3. `navigator.connection`. Coarse (four buckets, and Chromium-only), but
       free and instant, and the only signal available before the first probe
       comes back.

  Samples accumulate and the verdict is taken from the *median* of them, not
  the last one. A single slow packet should not flip the verdict, and the
  history is what lets the readout show a sparkline instead of a lone number.

  ---------------------------------------------------------------------------
  The design
  ---------------------------------------------------------------------------

  The old boot animation was a terminal window - a macOS-style frame with
  three dots, `emdevman - zsh` in the title bar, and a checklist of sections
  ticking themselves off. It was a 285KB GIF, which is a lot to download to
  show a picture of a terminal.

  This is that terminal, built in the DOM instead. The frame is a border, the
  title bar is a flex row, and the checklist is real: each line is a section
  that has actually arrived in the document, so the boot sequence reports what
  the page is doing rather than a fixed animation.

  The diagnostic lives in the terminal because that is where it belongs. A
  latency readout hanging under a terminal window is two unrelated things
  stacked; inside it, the network is another line of the same boot log.
*/

/* --- tuning ---------------------------------------------------------------- */

/** How long the overlay stays up at minimum, in milliseconds. */
const MIN_DURATION_MS = 3000;

/** The fade at the end. */
const FADE_MS = 360;

/**
 * Round trips above this are "slow".
 *
 * 400ms is the point at which a click stops feeling like a click. It is
 * measured as the network's share of the round trip, with the server's own
 * processing time already subtracted.
 */
const SLOW_RTT_MS = 400;

/** Round trips above this are "very slow" - bad enough to say so plainly. */
const VERY_SLOW_RTT_MS = 1200;

/**
 * Effective throughput below this (megabits/sec) is "slow".
 *
 * Read from `navigator.connection` only. It is a bucketed estimate, so the
 * threshold is placed at the bottom of a bucket rather than inside one.
 */
const SLOW_DOWNLINK_MBPS = 1;

/** How many samples the sparkline keeps. */
const HISTORY_LENGTH = 24;

/**
 * How often the probe repeats while the overlay is up.
 *
 * The overlay lives for about three seconds, so this is the number of samples
 * that fit in it: 450ms gives six, which is enough for the sparkline to show
 * the shape of the connection rather than two bars. The endpoint answers in a
 * couple of milliseconds, so the cost is a handful of tiny requests.
 */
const PROBE_INTERVAL_MS = 450;

/* --- types ----------------------------------------------------------------- */

type NetBand = "checking" | "good" | "slow" | "very-slow" | "offline";

interface Sample {
  /** Network-only round trip, in milliseconds. */
  rttMs: number;
  /** When it was taken. */
  at: number;
}

interface NetInfo {
  band: NetBand;
  /** Median of the samples taken so far. */
  rttMs: number | null;
  /** Spread between the fastest and slowest sample. */
  jitterMs: number | null;
  /** The browser's own throughput estimate. */
  downlinkMbps: number | null;
  /** The samples, oldest first. */
  history: Sample[];
}

/* --- helpers --------------------------------------------------------------- */

/**
 * Whether the visitor has asked for less motion.
 *
 * Subscribed rather than stored: the media query is an external system, and
 * `useSyncExternalStore` is the way to read one without a `setState` in an
 * effect body and the second render pass that comes with it.
 */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** The subset of `navigator.connection` this uses. */
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, handler: () => void) => void;
  removeEventListener?: (type: string, handler: () => void) => void;
}

const getConnection = (): NetworkInformation | undefined =>
  (navigator as Navigator & { connection?: NetworkInformation }).connection;

/**
 * Pull the server's own processing time out of a `Server-Timing` header.
 *
 * The header is `app;dur=1.23`, and the number is optional - a server that
 * does not measure itself sends the metric with no duration. Returns null for
 * both "no header" and "no duration", and the caller treats that as "no
 * subtraction", which leaves the round trip slightly pessimistic rather than
 * reporting a latency that is too low.
 */
const parseServerTiming = (header: string | null): number | null => {
  if (!header) return null;
  const match = /dur=([\d.]+)/.exec(header);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

/**
 * The median of a list of numbers.
 *
 * The midpoint of the two middle values for an even-length list, so the
 * result is a real sample rather than an average of two that may never have
 * occurred together.
 */
const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Turn samples into a verdict.
 *
 * The band comes from the median, not the worst sample: a link that is
 * briefly slow is a different thing from a link that is slow, and a reader
 * watching the sparkline can see the difference for themselves.
 */
const classify = (
  history: Sample[],
  downlinkMbps: number | null,
  offline: boolean
): NetBand => {
  if (offline) return "offline";
  if (history.length === 0) return "checking";

  const rtt = median(history.map((sample) => sample.rttMs));
  if (rtt === null) return "checking";

  if (rtt >= VERY_SLOW_RTT_MS) return "very-slow";
  if (rtt >= SLOW_RTT_MS) return "slow";
  if (downlinkMbps !== null && downlinkMbps < SLOW_DOWNLINK_MBPS) return "slow";
  return "good";
};

/* --- component ------------------------------------------------------------- */

type Phase = "visible" | "leaving" | "gone";

/**
 * The boot checklist.
 *
 * Each entry is a real thing that has to happen before the page is usable, and
 * a line is struck through the moment it has. The order is the order they
 * complete in, which is the point: a checklist that ticks out of sequence looks
 * broken even when every line is true.
 *
 *   shell    - the HTML arrived. True from the first frame, and it is the one
 *              line that is guaranteed to be true, so the list always has
 *              something on it.
 *   sections - React committed the page content.
 *   assets   - the fonts are loaded, so nothing reflows under the reader.
 *   link     - the network has been measured, and carries the verdict.
 */
const BOOT_STEPS = [
  { key: "shell", label: "shell" },
  { key: "sections", label: "sections" },
  { key: "assets", label: "assets" },
  { key: "link", label: "link" },
] as const;

type BootKey = (typeof BOOT_STEPS)[number]["key"];

export default function LoadingOverlay() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("visible");
  const [net, setNet] = useState<NetInfo>({
    band: "checking",
    rttMs: null,
    jitterMs: null,
    downlinkMbps: null,
    history: [],
  });
  const [done, setDone] = useState<Record<BootKey, boolean>>({
    shell: true,
    sections: false,
    assets: false,
    link: false,
  });

  const mountedAtRef = useRef(0);
  const historyRef = useRef<Sample[]>([]);

  /*
    Whether the probe should be running.

    A boolean rather than the phase itself, because the effect below depends on
    it. Depending on `phase` directly would re-run the effect on every step of
    the dismissal - visible, leaving, gone - restarting the probe and the
    interval each time, and the dependency array would change size between
    renders when the phase first moved off "visible". A boolean flips once, in
    one direction, and never comes back.
  */
  const probing = phase !== "gone";

  /* --- the probe ---------------------------------------------------------- */
  useEffect(() => {
    /*
      Stop when the overlay is gone.

      The component stays mounted for the life of the page - it returns null
      rather than unmounting - so an effect with no dependency on the phase
      would keep polling /api/ping for as long as the tab was open. The
      overlay is the only thing that shows the measurement, and once it has
      left there is nothing to measure for.
    */
    if (!probing) return;

    let cancelled = false;

    const push = (sample: Sample) => {
      historyRef.current = [...historyRef.current, sample].slice(-HISTORY_LENGTH);
    };

    /**
     * One round trip to the origin.
     *
     * The clock starts before the request and stops when the body has been
     * read, so this is the whole round trip: DNS, TCP, TLS, the server, and
     * the bytes back. The server's own share comes out of `Server-Timing`, and
     * what is left is the network.
     */
    const probe = async () => {
      const started = performance.now();
      try {
        const response = await fetch("/api/ping", {
          cache: "no-store",
          method: "GET",
        });
        if (!response.ok) throw new Error(`ping ${response.status}`);
        await response.text();
        if (cancelled) return;

        const total = performance.now() - started;
        const serverMs = parseServerTiming(response.headers.get("Server-Timing"));
        // With no server timing, the whole round trip is charged to the
        // network. That overstates it slightly, which is the safe direction:
        // a pessimistic number does not send someone looking for a problem
        // that is not there.
        const rttMs = Math.max(0, total - (serverMs ?? 0));
        push({ rttMs, at: Date.now() });

        setNet((previous) => {
          const history = historyRef.current;
          const values = history.map((sample) => sample.rttMs);
          return {
            ...previous,
            rttMs: median(values),
            jitterMs: values.length > 1 ? Math.max(...values) - Math.min(...values) : null,
            history,
            /*
              The verdict is recomputed here, not only in the connection
              listener. A sample is the thing that changes the answer, and
              leaving the band to be set by a separate event meant the overlay
              sat on "checking" for the whole of its life - the number updated
              and the word never did.
            */
            band: classify(history, previous.downlinkMbps, !navigator.onLine),
          };
        });
        setDone((previous) => ({ ...previous, link: true }));
      } catch {
        if (cancelled) return;
        /*
          A failed probe is not proof of an offline link - it could be a
          blocked route, a service worker, anything. `navigator.onLine` is the
          only thing that can say "offline" with confidence, and it is checked
          separately. Here the sample is simply not recorded.
        */
      }
    };

    /* The first probe, immediately, so there is a number early. */
    void probe();
    const interval = window.setInterval(() => void probe(), PROBE_INTERVAL_MS);

    /* --- the other signals ------------------------------------------------ */
    const connection = getConnection();
    const applyConnection = () => {
      const conn = getConnection();
      const downlink = typeof conn?.downlink === "number" ? conn.downlink : null;
      setNet((previous) => ({
        ...previous,
        downlinkMbps: downlink,
        band: classify(historyRef.current, downlink, !navigator.onLine),
      }));
    };

    const handleOnline = () => {
      setNet((previous) => ({
        ...previous,
        band: classify(historyRef.current, previous.downlinkMbps, false),
      }));
      void probe();
    };
    const handleOffline = () => {
      setNet((previous) => ({ ...previous, band: "offline" }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    connection?.addEventListener?.("change", applyConnection);
    applyConnection();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      connection?.removeEventListener?.("change", applyConnection);
    };
  }, [probing]);

  /* --- what the page has actually finished doing -------------------------- */
  useEffect(() => {
    if (!probing) return;

    const mark = (key: BootKey) => setDone((previous) => (previous[key] ? previous : { ...previous, [key]: true }));

    /*
      The sections mounting and the fonts loading.

      Observed rather than timed: the overlay is a sibling of the page content,
      so it cannot be told when React has committed the sections except by
      looking for them. A short poll is enough - the page is either there or
      it is not, and this stops within a frame or two of it being there.

      The font check is the same idea for the same reason. `document.fonts`
      reports "loading" until the last face has arrived, and a page that
      reflows under the reader because a font landed late is exactly the
      jank this overlay is covering.
    */
    const poll = window.setInterval(() => {
      if (document.querySelector("#home") || document.querySelector("#projects")) mark("sections");
      if (document.fonts?.status === "loaded") mark("assets");
    }, 120);

    return () => window.clearInterval(poll);
  }, [probing]);

  /* --- dismissal ---------------------------------------------------------- */
  useEffect(() => {
    mountedAtRef.current = Date.now();
    let cancelled = false;

    /*
      The overlay leaves when the page is genuinely ready, and not before the
      minimum has passed.

      The old version used a fixed three seconds and a counter that counted
      up to it, which meant the number on screen was the amount of time
      remaining rather than the amount of time elapsed - and it said the same
      thing on a fast connection as on a slow one. This waits for the real
      signals and shows what they actually are.
    */
    const intervalId = window.setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < MIN_DURATION_MS) return;
      if (document.readyState !== "complete") return;
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

  /* Lock body scroll while the overlay is up; restore when it leaves. */
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

  /*
    The verdict, and the words that go with it.

    Kept as a lookup rather than a chain of ternaries because there are five
    states and the mapping from state to copy is the part worth reading.
  */
  const VERDICT: Record<NetBand, { word: string; detail: string }> = {
    checking: { word: "checking", detail: "measuring round trip" },
    good: { word: "ok", detail: "connection is healthy" },
    slow: { word: "slow", detail: "expect pages to take a moment" },
    "very-slow": { word: "very slow", detail: "this may take a while" },
    offline: { word: "offline", detail: "no connection detected" },
  };
  const verdict = VERDICT[net.band];
  const danger = net.band === "offline" || net.band === "very-slow";

  /*
    The sparkline.

    The bars are the samples, oldest on the left. The scale is relative to the
    slowest sample so the shape of the history is always readable - a fixed
    scale would flatten every healthy history to nothing.

    The tallest bar is the slowest sample, which is the one worth seeing.
  */
  const slowest = Math.max(1, ...net.history.map((sample) => sample.rttMs));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      data-loading-overlay=""
      className="loading-overlay"
      style={{
        opacity: leaving ? 0 : 1,
        transition,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div className="loading-shell">
        {/*
          The terminal frame.

          A border, a title bar and a body. The three dots are the macOS
          window controls, drawn rather than coloured - the design language is
          monochrome, and a row of coloured circles would be the only saturated
          thing on the page.
        */}
        <div className="loading-window">
          <div className="loading-window-bar">
            <span className="loading-window-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="loading-window-title">emdevman - zsh</span>
          </div>

          <div className="loading-window-body">
            <p className="loading-prompt">
              <span className="loading-prompt-mark">$</span> emdevman
            </p>

            {/*
              The checklist.

              Real state: each line is struck through when the thing it names
              has actually happened, and the marks appear as they land rather
              than in a fixed sequence.
            */}
            <ul className="loading-steps">
              {BOOT_STEPS.map((step) => {
                const finished = done[step.key];
                const isLink = step.key === "link";
                return (
                  <li
                    key={step.key}
                    className={`loading-step${finished ? " loading-step--done" : ""}${
                      isLink ? " loading-step--link" : ""
                    }`}
                  >
                    <span className="loading-step-label">{step.label}</span>
                    {isLink ? (
                      <span className="loading-step-verdict">{verdict.word}</span>
                    ) : (
                      <span className="loading-step-mark" aria-hidden="true">
                        {finished ? "✓" : ""}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/*
              The diagnostic.

              Only shown once there is something to say. A reader whose
              connection is fine gets a terminal that boots and leaves, which
              is the whole of what they should be looking at.
            */}
            {net.band !== "checking" ? (
              <div className="loading-diag">
                <div className="loading-diag-head">
                  <span
                    className={`loading-diag-dot${danger ? " loading-diag-dot--danger" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="loading-diag-verdict">{verdict.word}</span>
                  <span className="loading-diag-detail">{verdict.detail}</span>
                </div>

                {net.history.length > 0 ? (
                  <div className="loading-spark" aria-hidden="true">
                    {net.history.map((sample, index) => (
                      <span
                        key={`${sample.at}-${index}`}
                        className="loading-spark-bar"
                        style={{
                          height: `${Math.max(8, (sample.rttMs / slowest) * 100)}%`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {/*
                  The numbers.

                  Tabular, because they update in place and proportional digits
                  would make the whole row twitch on every sample. Read out for
                  a screen reader, because a bar chart and a set of heights say
                  nothing.
                */}
                <dl className="loading-metrics">
                  <div className="loading-metric">
                    <dt className="loading-metric-key">rtt</dt>
                    <dd className="loading-metric-value">
                      {net.rttMs !== null ? `${Math.round(net.rttMs)}ms` : "—"}
                    </dd>
                  </div>
                  <div className="loading-metric">
                    <dt className="loading-metric-key">jitter</dt>
                    <dd className="loading-metric-value">
                      {net.jitterMs !== null ? `${Math.round(net.jitterMs)}ms` : "—"}
                    </dd>
                  </div>
                  <div className="loading-metric">
                    <dt className="loading-metric-key">down</dt>
                    <dd className="loading-metric-value">
                      {net.downlinkMbps !== null ? `${net.downlinkMbps.toFixed(1)}mbps` : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
