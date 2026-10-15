import Link from "next/link";
import { usePathname } from "next/navigation";

import { hiddenRoutes } from "@/app/lib/navigation";

import { v1Sections } from "./sections";

/**
 * v1's navigation: one sticky white bar, wordmark left, links right.
 *
 * 78px tall, shadow-md, pinned to the top. The inner container is
 * `max-w-7xl px-6 lg:px-8` - the same string the hero uses - so the wordmark
 * lands on the headline's left edge and the last link on the portrait's right
 * edge. Two different containers here is what put the logo 32px inside the hero
 * text and made the whole bar look offset.
 *
 * `no-underline` is on every link. v1's stylesheet used to underline all links
 * from an unlayered rule that outranked the utility, so this class is as much
 * documentation as it is styling - see the note on `html[data-design="v1"] a`.
 *
 * The links wrap rather than collapsing behind a disclosure: there is no menu
 * button to animate open, and v1's stylesheet disables transitions outright.
 */
export function V1Nav() {
  const pathname = usePathname();

  if (hiddenRoutes.includes(pathname)) return null;

  /*
    Home, About, Projects, Tech Stack, Contact.

    Derived from `v1Sections` rather than hand-written so the hrefs stay in step
    with the sections they point at, but re-ordered to the design's reading
    order and with `home` hoisted to the front. `home` is normally the wordmark's
    target rather than a link in the bar; the design wants it in the list too.
  */
  const order = ["home", "about", "projects", "tech-stack", "contact"];
  const links = order
    .map((id) => v1Sections.find((section) => section.id === id))
    .filter((section) => section !== undefined);

  return (
    <nav
      className="w-full min-h-[78px] bg-white shadow-md sticky top-0 z-50"
      aria-label="Primary navigation"
    >
      {/*
        Same container as the hero: max-w-7xl, px-6, px-8 from lg.

        `min-h` rather than `h`, and `flex-wrap`, because five links plus the
        ENLSB wordmark do not fit a 320px screen side by side - the link list
        alone is 353px, so 134px of it ran off the right edge at 320 and it was
        still overflowing at 414. Tightening the gap and stepping the type down
        below `sm` brings it to a single row at 320 (279px of links in 288px of
        space); the wrap is the safety net for anything narrower than that,
        which is the honest behaviour when a bar genuinely cannot fit.
      */}
      <div className="max-w-7xl mx-auto w-full min-h-[78px] px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 sm:py-0">
        {/* Wordmark. */}
        <Link
          href="/"
          className="no-underline hover:no-underline text-2xl font-bold tracking-wide text-blue-600 shrink-0"
          aria-label="ENLSB - Emmanuel Bitancor, home"
        >
          ENLSB
        </Link>

        {/* Links: slate-700, blue on hover, ~32px apart from sm. */}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-8">
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
      </div>
    </nav>
  );
}
