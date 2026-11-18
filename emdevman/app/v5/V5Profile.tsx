"use client";

import { CorridorGallery } from "@/app/sections/CorridorGallery";
import { useDesign } from "@/app/context/DesignProvider";

import { V5Connect } from "./V5Connect";
import { V5EducationExperience } from "./V5EducationExperience";
import { V5GithubCalendar } from "./V5GithubCalendar";
import { V5Header } from "./V5Header";

/**
 * v5's page: the full-viewport parallax hero, the corridor gallery, the GitHub
 * calendar, the background section, then the closing contact section.
 *
 * The old profile feed - tab strip, six panels, mobile bottom bar - is gone,
 * and so is the social-profile block that briefly replaced it. The hero keeps
 * the scene and name; the gallery below is the work itself.
 *
 * The entrance is owned by the global loader in the root layout: it writes
 * `data-app-loaded` onto <html> when it starts to leave, and v5.css uses that
 * attribute for the staged fade (copy first, portrait last). The page itself
 * stays stateless here.
 *
 * The gallery is mounted outside `.v5-frame` so its full-bleed black stage can
 * run edge to edge rather than inheriting the hero column's width.
 */
export function V5Profile() {
  const { design } = useDesign();

  return (
    <>
      <div className="v5-frame v5-frame--hero">
        <main className="v5-column" id="v5-feed">
          <div className="v5-hero-shell">
            <V5Header />
          </div>
        </main>
      </div>

      <CorridorGallery enabled={design === "v5"} />
      <V5GithubCalendar enabled={design === "v5"} />
      <V5EducationExperience />
      <V5Connect enabled={design === "v5"} />
    </>
  );
}
