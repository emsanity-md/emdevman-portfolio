import Hero from "./sections/Hero";
import Projects from "./sections/Projects";
import About from "./sections/About";
import TechStack from "./sections/TechStack";
import Contact from "./sections/Contact";
import GitHubContributions from "./components/GitHubContributions";
import { CursorTour, type DesignStep, type NavStep, type Tip } from "./components/ui/cursor-tour";
import { V1Home } from "./v1/V1Home";
import { V4Home } from "./v4/V4Home";
import { V5Profile } from "./v5/V5Profile";
import { V5Root } from "./v5/V5Root";

/*
  The tour's copy, in the order the tour performs it: the hero, the header's
  links one at a time, then the design switcher.

  The link copy is keyed by section id rather than by design, and the tour
  finds the link for each by its fragment - so these work under v1's top bar
  and v3's left rail alike, with no per-design list to keep in step. A section
  the current design does not have is skipped at runtime rather than faked.

  Copy is deliberately one sentence each. A tooltip the reader has to scroll
  through has stopped being a tooltip.
*/
const heroTip: Tip = {
  title: "Hello",
  body: "Hi there - welcome to my portfolio. This is where i show what i do and how i do it.",
};

const navIntro: Tip = {
  title: "The links",
  body: "Everything on this site hangs off this bar. Let me press each one so you can see what it opens.",
};

const navSteps: NavStep[] = [
  {
    section: "tech-stack",
    title: "Tech Stack",
    body: "The stack i mostly use, followed by a four-step path from idea to impact.",
  },
  {
    section: "projects",
    title: "Projects",
    body: "Case studies i created and you can open, each with the problem, the build and what came out of it.",
  },
  {
    section: "about",
    title: "About",
    body: "Current focus, the principles i work by, and the frames i built inside.",
  },
  {
    section: "contact",
    title: "Contact",
    body: "A form that actually sends, plus copy-email, GitHub and LinkedIn in one place.",
  },
];

/*
  Act four. The designs are the one thing about this project that no amount of
  scrolling reveals, which is why the tour ends by pressing the switcher rather
  than pointing at it and moving on.
*/
const designIntro: Tip = {
  title: "Five designs",
  body: "This portfolio was rebuilt five separate times. Same content, five visual directions - pick your favourite, it remembers.",
};

/*
  One line per design, oldest first, matching the order the tour presses them.

  Each says what the design *is* rather than praising it. All five are listed,
  including v5: the switcher's menu offers it and `page.tsx` mounts the v5 tree
  behind `data-design="v5"`, so it is a real choice from this page and not only
  a route of its own.
*/
const designSteps: DesignStep[] = [
  {
    id: "v1",
    title: "v1",
    body: "The first one. A plain, fast light layout - and the only design that ships with no motion at all.",
  },
  {
    id: "v2",
    title: "v2",
    body: "The dark gradient pass. Cards, badges and a hover tilt on the profile.",
  },
  {
    id: "v3",
    title: "v3",
    body: "The default. Print-inspired halftone, mono type, a narrow reading measure.",
  },
  {
    id: "v4",
    title: "v4",
    body: "The CV design - a yellow and charcoal two-column resume sheet.",
  },
  {
    id: "v5",
    title: "v5",
    body: "The newest. A social feed: pinned intro, then activity and projects as tabs.",
  },
];

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
    <>
      <div className="page-inner flex w-full flex-col">
      <div className="v1-only">
        <V1Home />
      </div>

      <div className="v4-only">
        <V4Home />
      </div>

      <div className="v5-only">
        <V5Root>
          <V5Profile />
        </V5Root>
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

      <CursorTour
          hero={heroTip}
          navIntro={navIntro}
          navSteps={navSteps}
          designIntro={designIntro}
          designSteps={designSteps}
          startDesign="v1"
        />
    </>
  );
}