"use client";

import type { CSSProperties } from "react";
import {
  Accessibility,
  ArrowRight,
  Code2,
  MapPin,
  MessageSquareText,
  MonitorSmartphone,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import Portrait from "../components/ui/Portrait";
import ProfileCard from "../components/ui/ProfileCard";
import { useDesign } from "@/app/context/DesignProvider";
import { EMAIL_MAILTO } from "@/app/lib/contact";
import profileImage from "../assets/images/PROFILE-IMAGE-NO-BG.png";

const strengths = [
  { label: "Full-stack", icon: Code2 },
  { label: "Accessible", icon: Accessibility },
  { label: "Responsive", icon: MonitorSmartphone },
];

const socials = [
  { label: "github", href: "https://github.com/emsanity-md" },
  { label: "linkedin", href: "https://www.linkedin.com/in/emmanuel-bitancor-40a582426" },
  { label: "email", href: EMAIL_MAILTO },
];

/**
 * The two heroes are genuinely different layouts, not one markup restyled by
 * CSS: V2 puts a greeting, a tagline, two raised buttons and the portrait
 * on the right, while v3 puts a bare pixel name beside a small portrait and
 * nothing but mono social links below. So the branch lives here, above every
 * hook, and each layout is written for its own design.
 */
export default function Hero() {
  const { design } = useDesign();

  if (design === "v3") return <V3Hero />;

  return <V2Hero />;
}

function V3Hero() {
  return (
    <section id="home" className="hero relative z-10">
      {/* Padding belongs to the shell - html[data-design="v3"] .hero owns it,
          so the hero shares the section gutter instead of sitting out of line
          with everything below it. */}
      <div className="grid gap-9 sm:grid-cols-[18rem_1fr] sm:items-start sm:gap-10">
        {/* The portrait leads, at a fixed 18rem, and never grows. v3 has no
            card here - just the image.

            Imported straight from app/assets, the way app/lib/about.ts imports
            the stills, so there is no second copy in public/ to keep in step.
            The subject is solid (97% of its pixels sit at alpha 250-255, the
            rest is edge feathering) and the 45% that is fully transparent is the
            background around it, so it needs no plate behind it. V2's profile
            card and the social card take their own image instead. */}
        <div
          className="reveal mx-auto w-full max-w-[18rem] sm:mx-0"
          style={{ "--reveal-index": 1 } as CSSProperties}
        >
          <Portrait src={profileImage} alt="Emmanuel Bitancor" />
        </div>

        <div>
          <h1
            className="reveal display-pixel text-3xl leading-none sm:text-[2.6rem]"
            style={{ "--reveal-index": 2 } as CSSProperties}
          >
            Emmanuel Bitancor
          </h1>
          <p
            className="reveal mt-6 text-[15px] leading-relaxed text-muted-foreground"
            style={{ "--reveal-index": 3 } as CSSProperties}
          >
            I&apos;m a full-stack engineer. I build modern web & mobile apps, and these days I&apos;m focused on generative AI.
          </p>
          <p
            className="reveal mt-5 text-[15px] leading-relaxed text-muted-foreground"
            style={{ "--reveal-index": 4 } as CSSProperties}
          >
            I like taking a rough idea and turn it into something people
            actually want to use.
          </p>

          {/* Mono text links with a trailing arrow - not buttons. */}
          <div
            className="reveal mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[12px] text-muted-foreground"
            style={{ "--reveal-index": 5 } as CSSProperties}
          >
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="hover:text-foreground"
              >
                {social.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function V2Hero() {
  return (
    <section
      id="home"
      className="hero-v2 relative z-10 w-full overflow-hidden px-4 pb-16 pt-28 text-foreground transition-colors duration-300 md:px-6 md:pb-24 md:pt-36 lg:pb-32"
    >
      <div className="container relative mx-auto">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_450px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="flex flex-col justify-center">
            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-display">
                Hi, I&apos;m{" "}
                <span className="text-sky-700 dark:text-sky-300">Emmanuel.</span>
                <span className="mt-2 block font-display text-2xl font-semibold italic text-violet-700 sm:text-3xl dark:text-violet-300">
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
                  <Icon className="size-3.5 text-sky-600 dark:text-sky-300" aria-hidden="true" />
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
