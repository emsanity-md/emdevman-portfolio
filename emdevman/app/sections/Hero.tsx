import {
  Accessibility,
  ArrowRight,
  Code2,
  MapPin,
  MessageSquareText,
  MonitorSmartphone,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import ProfileCard from "../components/ui/ProfileCard";

const strengths = [
  { label: "Full-stack", icon: Code2 },
  { label: "Accessible", icon: Accessibility },
  { label: "Responsive", icon: MonitorSmartphone },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative z-10 w-full overflow-hidden px-4 pb-16 pt-28 text-foreground transition-colors duration-300 md:px-6 md:pb-24 md:pt-36 lg:pb-32"
    >
      <div className="container mx-auto">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_450px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="flex flex-col justify-center">
            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl xl:leading-[1.05]">
                Hi, I&apos;m{" "}
                <span className="text-zinc-500 dark:text-zinc-400">Emmanuel.</span>
                <span className="mt-2 block font-display text-2xl font-semibold italic text-zinc-700 sm:text-3xl dark:text-zinc-300">
                  I build useful things for the web.
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg md:text-xl dark:text-zinc-400">
                I&apos;m a full-stack developer focused on clear interfaces, dependable
                implementation and smooth experiences across devices.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full min-[400px]:w-auto"
              >
                <a href="#projects">
                  View Projects
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-full min-[400px]:w-auto"
              >
                <a href="#contact">
                  <MessageSquareText className="size-4" aria-hidden="true" />
                  Send a message
                </a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                Philippines
              </span>
              {strengths.map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon className="size-3.5 text-zinc-400" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="h-[400px] w-full max-w-xs sm:h-[460px] sm:max-w-md lg:h-[480px] [perspective:1000px]">
              <ProfileCard
                name="Emmanuel"
                title="Full-Stack Developer"
                avatarUrl="/assets/images/profile3-4k.webp"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
