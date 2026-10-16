"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Menu, X } from "lucide-react";

import { hiddenRoutes } from "@/app/lib/navigation";

import { v1Sections } from "./sections";

/**
 * v1's navigation: one sticky white bar, wordmark left, links right.
 *
 * 78px tall, shadow-md, pinned to the top. The inner container is
 * `max-w-7xl px-6 lg:px-8` - the same string the hero uses - so the wordmark
 * lands on the headline's left edge and the last link on the portrait's right
 * edge.
 *
 * On small screens (below md) the five links do not fit reliably in a 320px
 * bar, so instead of wrapping the whole row we collapse it behind a hamburger
 * button. Pressing it drops down a stacked list; a tap on any link, Escape,
 * or resizing back to md closes it again. Desktop renders the links inline as
 * before.
 *
 * `no-underline` is on every link. v1's stylesheet used to underline all links
 * from an unlayered rule that outranked the utility, so this class is as much
 * documentation as it is styling - see the note on `html[data-design="v1"] a`.
 */
export function V1Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const firstLink = (document.querySelector("#v1-mobile-navigation a") as HTMLAnchorElement | null);
    firstLink?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  if (hiddenRoutes.includes(pathname)) return null;

  const order = ["home", "about", "projects", "tech-stack", "contact"];
  const links = order
    .map((id) => v1Sections.find((section) => section.id === id))
    .filter((section) => section !== undefined);

  return (
    <nav
      className="w-full min-h-[78px] bg-white shadow-md sticky top-0 z-50"
      aria-label="Primary navigation"
    >
      <div className="max-w-7xl mx-auto w-full min-h-[78px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-x-4 gap-y-1 py-2 sm:py-0">
        <Link
          href="/"
          className="no-underline hover:no-underline text-2xl font-bold tracking-wide text-blue-600 shrink-0"
          aria-label="ENLSB - Emmanuel Bitancor, home"
          onClick={() => setIsOpen(false)}
        >
          ENLSB
        </Link>
        <ul className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-8">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`/#${link.id}`}
                className="no-underline hover:no-underline text-sm sm:text-base sm:text-lg font-medium text-slate-700 hover:text-blue-600 whitespace-nowrap"
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>
        <button
          ref={toggleRef}
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-slate-700 hover:bg-slate-100 hover:text-blue-600"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="v1-mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen ? (
        <div
          id="v1-mobile-navigation"
          className="md:hidden border-t border-slate-200 bg-white"
        >
          <ul className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-y-1">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={`/#${link.id}`}
                  onClick={() => setIsOpen(false)}
                  className="no-underline hover:no-underline block w-full px-2 py-3 text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}