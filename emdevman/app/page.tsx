import Hero from "./sections/Hero";
import Projects from "./sections/Projects";
import About from "./sections/About";
import TechStack from "./sections/TechStack";
import Contact from "./sections/Contact";
import GitHubContributions from "./components/GitHubContributions";
import { V1Home } from "./v1/V1Home";
import { V4Home } from "./v4/V4Home";

export default function Home() {
  return (
    /*
      Three trees, one visible at a time, picked by `data-design` in globals.css.

      v1 and v4 are their own components rather than more bodies inside the
      existing sections, so the choice happens once here instead of six times
      over. The split is CSS rather than a `useDesign()` branch because the
      server can only ever prerender the default design: a branch would hand a v1
      visitor v3 markup for the first paint.

      `.legacy-only` keeps the v2/v3 tree intact and flex-column inside
      `.page-inner`, so those two designs do not see the wrapper at all.
    */
    <div className="page-inner flex w-full flex-col">
      <div className="v1-only">
        <V1Home />
      </div>

      <div className="v4-only">
        <V4Home />
      </div>

      <div className="legacy-only">
        {/*
          One container for the whole page, hero included.

          The reference wraps every section in a single `mx-auto max-w-2xl px-6`,
          and that is the only reason its content lines up: one measure, one
          gutter, one centre line. Here the hero had no container at all while
          each section carried its own max-width, so the hero sat flush to the
          viewport edge and the sections sat on two different left edges.

          Scoped to v3 in CSS; v2 keeps its own per-section measure, and v1
          brings its own `.v1-inner`.
        */}
        <Hero />
        <TechStack />
        <GitHubContributions />
        <Projects />
        <About />
        <Contact />
      </div>
    </div>
  );
}