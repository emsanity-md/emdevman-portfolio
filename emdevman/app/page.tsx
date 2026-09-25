import Hero from "./sections/Hero";
import Projects from "./sections/Projects";
import About from "./sections/About";
import TechStack from "./sections/TechStack";
import Contact from "./sections/Contact";
import GitHubContributions from "./components/GitHubContributions";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <TechStack />
      <GitHubContributions />
      <Projects />
      <About />
      <Contact />
    </div>
  );
}