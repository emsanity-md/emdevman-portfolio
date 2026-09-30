import Link from "next/link";

import { EMAIL_ADDRESS } from "@/app/lib/contact";

import { v1NavLinks } from "./sections";

/**
 * v1's footer: three columns of links on one hairline, then the copyright.
 *
 * No `.footer` markup - that class is styled for v2 and re-cast for v3, and both
 * versions of it carry a blurred fill and circular icon buttons. v1 gets its own
 * so neither has to be undone here.
 *
 * A server component, like the footer it sits beside, and so it renders on the
 * same routes that one does rather than hiding itself on `hiddenRoutes`.
 */
export function V1Footer() {
  return (
    <footer className="v1-footer">
      <div className="v1-inner">
        <div className="v1-footer-inner">
          <Link
            href="/"
            className="text-[0.9375rem] text-foreground no-underline hover:no-underline"
          >
            Emmanuel Bitancor
          </Link>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {v1NavLinks.map((link) => (
                <li key={link.id}>
                  <a href={`/#${link.id}`} className="v1-label text-foreground/70 hover:text-foreground">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={`mailto:${EMAIL_ADDRESS}`}
            className="v1-label break-all text-foreground/70 hover:text-foreground"
          >
            {EMAIL_ADDRESS}
          </a>
        </div>

        <p className="v1-footer-legal v1-label">
          © {new Date().getFullYear()} Emmanuel Bitancor. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
