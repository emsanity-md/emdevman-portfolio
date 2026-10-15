"use client";

import { useEffect, useState } from "react";

/**
 * Local time in Manila, for the hero's availability line.
 *
 * The point of the clock is that it answers "is it reasonable to email this
 * person right now", so it is the time where the work actually happens rather
 * than the reader's. Asia/Manila is the value `lib/weather.ts` already builds
 * the weather widget from, read here so the two cannot disagree about where
 * "local" is.
 *
 * Two details that are not optional:
 *
 *   - The first render is the server's, which has no idea what time it is in
 *     Manila. Rendering a real value there would mean a hydration mismatch on
 *     every single load, and the fix would be to flash a wrong time first. So
 *     the server renders a placeholder and the client fills it in.
 *   - `suppressHydrationWarning` on the two formatted values, because the
 *     server's placeholder and the client's real time are different text in the
 *     same node. The warning exists to catch exactly that, and here it is the
 *     point rather than a bug.
 *
 * One second is the update interval because the display is to the minute and a
 * faster tick would re-render forty-nine times a minute to redraw nothing.
 */
const TIME_ZONE = "Asia/Manila";

export function LocalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();

    // Aligned to the next minute boundary before the first interval, so the
    // displayed minute changes when it does rather than up to a second late.
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const interval = window.setInterval(tick, msToNextMinute + 1_000);

    return () => window.clearInterval(interval);
  }, []);

  const time = now
    ? new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: TIME_ZONE,
      }).format(now)
    : null;

  return (
    <span className="font-mono text-micro uppercase tracking-[0.14em] text-muted-foreground">
      <span aria-hidden="true" className="text-foreground">
        Manila&nbsp;
      </span>
      <span suppressHydrationWarning>
        {time ? (
          <>
            <span className="sr-only">Local time in Manila is </span>
            {time}
          </>
        ) : (
          "--:--"
        )}
      </span>
    </span>
  );
}