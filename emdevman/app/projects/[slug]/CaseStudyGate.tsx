"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useDesign } from "@/app/context/DesignProvider";

/**
 * Sends a v1 reader off a case-study page and back to the project list.
 *
 * v1 has no case studies. The route still exists for v2 and v3, and both of
 * those bodies are CSS-gated, so a v1 reader arriving here would find the page
 * body hidden - a blank shell with a working header and nothing in it.
 *
 * The redirect cannot happen on the server: the design lives in localStorage and
 * is read by a pre-paint script, so during prerender every route looks like the
 * default design. It has to be a client component, which means the page renders
 * for one frame before this runs. That is the trade for not duplicating a
 * fourth case-study body.
 */
export function CaseStudyGate() {
  const { design } = useDesign();
  const router = useRouter();

  useEffect(() => {
    if (design === "v1") router.replace("/#projects");
  }, [design, router]);

  return null;
}
