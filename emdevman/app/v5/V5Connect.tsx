"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowUp, ArrowUpRight, Github, Linkedin, MapPin } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { EMAIL_ADDRESS, EMAIL_MAILTO } from "@/app/lib/contact";
import { cvContact, cvProfile } from "@/app/lib/cv";

import { V5_FULL_NAME } from "./profile";

import "./v5-connect.css";

/*
  The CV's contact list is the shared source for these rows. Website is omitted:
  on this page it would link back to the portfolio the reader is already on.
*/
const socials = cvContact.filter(
  (link) => link.label === "GitHub" || link.label === "LinkedIn",
);

/**
 * The page's closing section.
 *
 * No form. The v3 contact section already owns the message form, and a second
 * one at the bottom of v5 would be the same four fields writing the same mailto.
 * Here the email is the action, with the profile links beside it, so the last
 * screen is a way to start a conversation rather than another block of content.
 */
export function V5Connect({ enabled = true }: { enabled?: boolean }) {
  const year = new Date().getFullYear();
  const sectionRef = useRef<HTMLElement>(null);

  /*
    Reveal the closing section the first time it reaches the viewport. The title
    is split into two word masks; everything below it follows as a short stagger.
    Only transform and opacity are touched, and the whole thing is scoped to this
    section with gsap.context so switching designs cannot leave stale ScrollTriggers
    or inline styles behind.
  */
  useLayoutEffect(() => {
    if (!enabled) return;

    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const status = section.querySelector<HTMLElement>(
        "[data-connect-status]",
      );
      const words = section.querySelectorAll<HTMLElement>(
        "[data-connect-word]",
      );
      const reveals = section.querySelectorAll<HTMLElement>(
        "[data-connect-reveal]",
      );

      gsap.set(status, { autoAlpha: 0, y: 14 });
      gsap.set(words, { yPercent: 115 });
      gsap.set(reveals, { autoAlpha: 0, y: 18 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      timeline
        .to(status, { autoAlpha: 1, y: 0, duration: 0.55 })
        .to(words, { yPercent: 0, duration: 0.95, stagger: 0.08 }, "-=0.25")
        .to(
          reveals,
          { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.06 },
          "-=0.55",
        );
    }, section);

    ScrollTrigger.refresh();

    return () => context.revert();
  }, [enabled]);

  return (
    <section
      ref={sectionRef}
      id="v5-connect"
      className="v5-connect"
      aria-labelledby="v5-connect-title"
    >
      <div className="v5-connect__inner">
        <header className="v5-connect__top">
          <p className="v5-connect__status" data-connect-status>
            <span aria-hidden="true" />
            Taking on new work and collaborations.
          </p>

          <div className="v5-connect__heading">
            <h2 id="v5-connect-title" className="v5-connect__title">
              <span className="v5-connect__word">
                <span className="v5-connect__word-inner" data-connect-word>
                  Let&apos;s
                </span>
              </span>{" "}
              <span className="v5-connect__word">
                <span className="v5-connect__word-inner" data-connect-word>
                  connect.
                </span>
              </span>
            </h2>
            <p className="v5-connect__intro" data-connect-reveal>
              Have a project, a role, or an idea worth talking through? Tell me
              what you&apos;re building — I read everything and reply within a
              day.
            </p>
          </div>
        </header>

        <a
          className="v5-connect__email"
          href={EMAIL_MAILTO}
          data-connect-reveal
        >
          <span className="v5-connect__email-label">Email</span>
          <span className="v5-connect__email-value">{EMAIL_ADDRESS}</span>
          <ArrowUpRight aria-hidden="true" />
        </a>

        <div className="v5-connect__links">
          {socials.map((social) => {
            const Icon = social.label === "GitHub" ? Github : Linkedin;

            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="v5-connect__link"
                data-connect-reveal
              >
                <Icon className="v5-connect__link-icon" aria-hidden="true" />
                <span className="v5-connect__link-copy">
                  <span className="v5-connect__link-label">{social.label}</span>
                  <span className="v5-connect__link-value">{social.value}</span>
                </span>
                <ArrowUpRight
                  className="v5-connect__link-arrow"
                  aria-hidden="true"
                />
              </a>
            );
          })}

          {cvProfile.location ? (
            <div className="v5-connect__place" data-connect-reveal>
              <MapPin className="v5-connect__link-icon" aria-hidden="true" />
              <span className="v5-connect__link-copy">
                <span className="v5-connect__link-label">Based in</span>
                <span className="v5-connect__link-value">
                  {cvProfile.location}
                </span>
              </span>
            </div>
          ) : null}
        </div>

        <footer className="v5-connect__footer" data-connect-reveal>
          <p>
            © {year} {V5_FULL_NAME}
          </p>
          <a href="#top" className="v5-connect__back">
            Back to top
            <ArrowUp aria-hidden="true" />
          </a>
        </footer>
      </div>
    </section>
  );
}

export default V5Connect;
