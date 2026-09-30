import Link from "next/link";
import { usePathname } from "next/navigation";

import { hiddenRoutes } from "@/app/lib/navigation";

import { v1NavLinks } from "./sections";

/**
 * v1's navigation: one sticky row, name on the left, links on the right.
 *
 * The links wrap onto a second line rather than collapsing behind a menu button,
 * because a disclosure would need something to animate. There is no theme
 * control either - v1 is light only and has no dark ramp to switch to.
 *
 * Plain `<a href="/#id">` rather than the shared `useSectionNavigation`, which
 * smooth-scrolls. The browser jumps instead, which is the honest behaviour for
 * a design with no motion.
 */
export function V1Nav() {
  const pathname = usePathname();

  if (hiddenRoutes.includes(pathname)) return null;

  return (
    <nav className="v1-nav" aria-label="Primary navigation">
      <div className="v1-inner v1-nav-inner">
        <Link
          href="/"
          className="text-[0.9375rem] text-foreground no-underline hover:no-underline"
        >
          Emmanuel Bitancor
        </Link>

        <ul className="v1-nav-links">
          {v1NavLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`/#${link.id}`}
                className="v1-label text-foreground/70 hover:text-foreground"
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
