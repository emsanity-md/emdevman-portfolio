"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  MapPin,
  Quote,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/app/components/ui/button";
import { Section } from "@/app/components/ui/Section";
import { V3About } from "./V3About";
import { aboutImages, aboutStrengths } from "../lib/about";

const images = aboutImages;
const strengths = aboutStrengths;

function formatImageIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export default function About() {
  /*
    Both bodies ship; CSS picks one.

    Not a `useDesign()` branch. That returns the server snapshot during
    hydration, so a v2 visitor would be served v3 *markup* while the
    pre-paint script had already put V2 *tokens* on <html> - V2's CSS
    styling v3's markup, with V2's content missing until hydration. The
    .v3-only / .v2-only pair costs a little extra HTML and has no such window.
  */
  return (
    <Section
      id="about"
      index="04"
      eyebrow="about"
      action={{ label: "more", href: "/#contact" }}
      both
      reveal
      icon={<Code2 className="section-badge-icon text-accent-b" aria-hidden="true" />}
      title={
        <>
          Building for people,
          <span className="about-title-second mt-1 block font-display text-4xl italic text-muted-foreground sm:text-5xl">
            not just screens.
          </span>
        </>
      }
      description="I&apos;m a passionate web development enthusiast with a strong eye for design and a drive for creating seamless digital experiences."
    >
      <div className="v3-only">
        <V3About />
      </div>
      <div className="v2-only">
        <V2About />
      </div>
    </Section>
  );
}

function V2About() {
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
    <>
      <div
        aria-hidden="true"
        className="about-glow pointer-events-none absolute -left-40 top-24 size-[28rem] rounded-full bg-muted blur-3xl"
      />

      <div className="relative">
        <div className="about-focus border-l-2 border-success-line pl-5">
          <p className="eyebrow text-muted-foreground">
            Current focus
          </p>
          <p className="mt-3 text-xl font-semibold leading-7 tracking-tight">
            Accessible interfaces that feel effortless.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-success" aria-hidden="true" />
            Building from the Philippines
          </div>
        </div>
      </div>

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
                <p className="eyebrow text-muted-foreground">
                  Working principles
                </p>
                <h3 className="mt-2 text-heading font-bold">
                  How I think about the work.
                </h3>
              </div>
              <span className="stat-value about-count">
                {String(strengths.length).padStart(2, "0")}
              </span>
            </div>

            <div className="rows">
              {strengths.map((strength, index) => {
                const Icon = strength.icon;
                return (
                  <div
                    key={strength.title}
                    className="about-principle row flex gap-4 py-5"
                  >
                    <div className="about-principle-icon flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="text-body font-semibold">{strength.title}</h4>
                        <span className="font-mono text-micro text-muted-foreground/60">
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

            <div className="about-quote surface-card mt-8 rounded-2xl border border-border bg-card p-5 text-foreground">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow text-surface-invert-muted">
                  Always learning
                </span>
                <Quote className="size-4 text-success" aria-hidden="true" />
              </div>
              <p className="about-quote-text mt-4 text-lg font-semibold leading-7">
                The best interfaces make the right thing feel obvious.
              </p>
              <a
                href="#contact"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-surface-invert-muted transition-colors hover:text-surface-invert-foreground"
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
              <div className="about-frame-rule absolute -inset-3 rounded-[2rem] border border-border/70" aria-hidden="true" />
              <div className="about-frame relative h-[360px] overflow-hidden rounded-[1.75rem] bg-muted shadow-2xl sm:h-[460px] lg:h-[540px]">
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
                      <p className="eyebrow text-white/65">
                        Frame {formatImageIndex(currentIndex)} / {formatImageIndex(images.length - 1)}
                      </p>
                      <p className="mt-2 max-w-lg text-xl font-semibold leading-7 text-white drop-shadow-md sm:text-2xl">
                        {images[currentIndex].caption}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 sm:left-7 sm:top-7">
                  <span className="about-frame-chip rounded-full border border-white/20 bg-black/20 px-3 py-1.5 eyebrow text-white/80 backdrop-blur">
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
                    className={`thumb group flex h-10 min-w-14 items-center justify-center border px-3 font-mono text-xs transition-colors ${
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
    </>
  );
}
