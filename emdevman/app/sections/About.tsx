"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  Globe,
  MapPin,
  Quote,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import coding1 from "../assets/images/coding1.png";
import coding2 from "../assets/images/coding2.png";
import coding3 from "../assets/images/coding3.png";

const images = [
  {
    src: coding1,
    alt: "Code editor showing a web application being developed",
    caption: "Turning ideas into maintainable interfaces",
  },
  {
    src: coding2,
    alt: "Developer workspace with monitors and coding equipment",
    caption: "Learning through building and iteration",
  },
  {
    src: coding3,
    alt: "Close-up of code and technical work in progress",
    caption: "Details matter—from data flow to polish",
  },
];

const strengths = [
  {
    icon: Code2,
    title: "Clean Code",
    description: "Maintainable, scalable foundations",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Fast, focused experiences",
  },
  {
    icon: Globe,
    title: "Responsive",
    description: "Mobile-first interaction design",
  },
  {
    icon: Cpu,
    title: "Modern Tech",
    description: "Next.js, React and TypeScript",
  },
];

function formatImageIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export default function About() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const goToPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const goToNext = () => {
    setCurrentIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX === undefined) return;

    const distance = touchEndX - touchStartX.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) goToPrevious();
      else goToNext();
    }
    touchStartX.current = null;
  };

  return (
    <section
      id="about"
      className="relative w-full overflow-hidden border-b border-zinc-200/70 bg-zinc-50/60 px-4 py-20 transition-colors duration-300 md:px-6 md:py-24 dark:border-zinc-800/70 dark:bg-zinc-900/25"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 size-[28rem] rounded-full bg-zinc-200/50 blur-3xl dark:bg-zinc-800/40"
      />

      <div className="container relative mx-auto max-w-6xl">
        <motion.div
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <Badge
              variant="outline"
              className="bg-background/70 px-3 py-1 font-mono text-xs backdrop-blur"
            >
              <Code2 className="size-3.5" aria-hidden="true" />
              About me
            </Badge>
            <h2 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Building for people,
              <span className="mt-1 block font-display text-4xl italic text-zinc-600 sm:text-5xl dark:text-zinc-300">
                not just screens.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg dark:text-zinc-400">
              I&apos;m a passionate web development enthusiast with a strong eye for
              design and a drive for creating seamless digital experiences.
            </p>
          </div>

          <div className="border-l-2 border-emerald-500/60 pl-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Current focus
            </p>
            <p className="mt-3 text-xl font-semibold leading-7 tracking-tight">
              Accessible interfaces that feel effortless.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Building from the Philippines
            </div>
          </div>
        </motion.div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-16">
          <motion.div
            className="order-2 lg:sticky lg:top-28 lg:order-1"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Working principles
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">
                  How I think about the work.
                </h3>
              </div>
              <span className="font-mono text-2xl font-semibold text-zinc-300 dark:text-zinc-700">
                {String(strengths.length).padStart(2, "0")}
              </span>
            </div>

            <div className="divide-y divide-border/70">
              {strengths.map((strength, index) => {
                const Icon = strength.icon;
                return (
                  <div
                    key={strength.title}
                    className="group flex gap-4 py-5 transition-colors first:pt-6 last:pb-6"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-zinc-700 transition-colors group-hover:border-emerald-500/40 group-hover:text-emerald-700 dark:bg-zinc-900 dark:text-zinc-200 dark:group-hover:text-emerald-300">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="font-semibold">{strength.title}</h4>
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {formatImageIndex(index)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {strength.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-50 shadow-sm dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Always learning
                </span>
                <Quote className="size-4 text-emerald-400" aria-hidden="true" />
              </div>
              <p className="mt-4 text-lg font-semibold leading-7">
                The best interfaces make the right thing feel obvious.
              </p>
              <a
                href="#contact"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                Let&apos;s build something thoughtful
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55 }}
          >
            <div
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="absolute -inset-3 rounded-[2rem] border border-border/70" aria-hidden="true" />
              <div className="relative h-[360px] overflow-hidden rounded-[1.75rem] bg-zinc-100 shadow-2xl sm:h-[460px] lg:h-[540px] dark:bg-zinc-800">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentIndex}
                    initial={reduceMotion ? false : { opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -60 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[currentIndex].src}
                      alt={images[currentIndex].alt}
                      fill
                      priority={currentIndex === 0}
                      className="object-cover"
                      sizes="(max-width: 1023px) 100vw, 60vw"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />
                    <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">
                        Frame {formatImageIndex(currentIndex)} / {formatImageIndex(images.length - 1)}
                      </p>
                      <p className="mt-2 max-w-lg text-xl font-semibold leading-7 text-white drop-shadow-md sm:text-2xl">
                        {images[currentIndex].caption}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 sm:left-7 sm:top-7">
                  <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
                    In the process
                  </span>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur sm:left-6"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur sm:right-6"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2" role="group" aria-label="Select gallery image">
                {images.map((image, index) => (
                  <button
                    key={image.alt}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`group flex h-10 min-w-14 items-center justify-center rounded-xl border px-3 font-mono text-xs transition-colors ${
                      index === currentIndex
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                    aria-label={`Show image ${index + 1}: ${image.caption}`}
                    aria-current={index === currentIndex ? "true" : undefined}
                  >
                    {formatImageIndex(index)}
                  </button>
                ))}
              </div>
              <p className="hidden text-right text-xs leading-5 text-muted-foreground sm:block">
                Swipe or use the arrows
                <br />
                to explore the frames
              </p>
            </div>

            <p className="sr-only" aria-live="polite">
              Image {currentIndex + 1} of {images.length}: {images[currentIndex].caption}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
