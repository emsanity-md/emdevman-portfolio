import { NextResponse } from "next/server";

/**
 * A latency probe.
 *
 * The point of this route is to be *small* and to be *uncached*, so what the
 * client measures is the network and not the server:
 *
 *   - The body is a few dozen bytes. The previous probe downloaded the 285KB
 *     boot animation to time it, which meant the thing being measured was the
 *     thing being downloaded - on a slow link the probe was most of the delay.
 *   - `no-store` on both the request and the response. A cached response
 *     answers in single-digit milliseconds from a CDN and reports a latency
 *     that has nothing to do with the visitor's connection.
 *   - `Server-Timing` carries the server's own processing time, so the client
 *     can subtract it and report the network portion rather than the round
 *     trip to a function that returns immediately.
 */

/** Force this to be dynamic. A prerendered route would answer from cache. */
export const dynamic = "force-dynamic";

/**
 * The server-side cost of answering, in milliseconds.
 *
 * Measured from the top of the handler, not from module load. A module-scope
 * timestamp would report the age of the server process - which on a long-lived
 * instance is minutes - and the client would subtract that from the round
 * trip and land on a latency of zero.
 */
const timed = async (body: string | null) => {
  const started = Date.now();
  // A yield, so the measurement includes the tick the response actually goes
  // out on rather than only the time to build a string. Without it the number
  // is so small it rounds to zero and measures nothing.
  await Promise.resolve();
  const serverMs = Date.now() - started;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      /*
        Both halves of it. The request's `cache: "no-store"` stops the browser
        reusing a previous answer; the response's stops any intermediary
        storing this one.
      */
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      /*
        `app` is the metric name and `dur` its duration, per the Server-Timing
        header's own grammar. The client reads it back with a regex and
        subtracts it from the round trip, so the number it shows is the
        network's share.
      */
      "Server-Timing": `app;dur=${serverMs.toFixed(2)}`,
    },
  });
};

export async function GET() {
  return timed(JSON.stringify({ ok: true, t: Date.now() }));
}

/**
 * HEAD is the cheap version.
 *
 * A client that only wants the timing can ask for headers and skip the body
 * entirely. The Server-Timing header is the whole answer, so the body is
 * redundant - but the route still has to exist, because some HTTP stacks will
 * not fall back from HEAD to GET.
 */
export async function HEAD() {
  return timed(null);
}
