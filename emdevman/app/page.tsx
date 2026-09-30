import Hero from "./sections/Hero";
import Projects from "./sections/Projects";
import About from "./sections/About";
import TechStack from "./sections/TechStack";
import Contact from "./sections/Contact";
import GitHubContributions from "./components/GitHubContributions";

export default function Home() {
  return (
    /*
      One container for the whole page, hero included.

      The reference wraps every section in a single `mx-auto max-w-2xl px-6`,
      and that is the only reason its content lines up: one measure, one gutter,
      one centre line. Here the hero had no container at all while each section
      carried its own max-width, so the hero sat flush to the viewport edge and
      the sections sat on two different left edges.

      Scoped to v3 in CSS; aurora keeps its own per-section measure.
    */
    <div className="page-inner flex w-full flex-col">
      <Hero />
      <TechStack />
      <GitHubContributions />
      <Projects />
      <About />
      <Contact />
    </div>
  );
}