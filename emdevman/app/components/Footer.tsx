import Link from "next/link";
import { ArrowUp } from "lucide-react";

import { EMAIL_MAILTO } from "../lib/contact";
import { navLinks } from "../lib/navigation";
import { V1Footer } from "../v1/V1Footer";

/**
 * Three designs, two of which share this markup. V2 keeps the wordmark, the
 * tagline, the inline nav and the circular icon buttons. v3 re-casts the same
 * elements through globals.css: a pixel wordmark, mono micro-labels over each
 * group, and social links as text with a trailing arrow rather than buttons.
 *
 * v1 has its own footer in `app/v1/V1Footer.tsx` and is gated in beside this
 * one, because a footer this size is not worth restyling twice - the blurred
 * fill and the icon buttons would all have to be undone rather than replaced.
 */
export default function Footer() {
  return (
    <>
      {/*
        The v2/v3 footer, hidden under v1. `.footer` is styled for v2 and
        re-cast for v3 - a blurred fill, circular icon buttons - and v1's is a
        different component entirely, so it cannot be selected for here.
      */}
      <div className="legacy-only">
        <LegacyFooter />
      </div>

      <div className="v1-only">
        <V1Footer />
      </div>
    </>
  );
}

function LegacyFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link
            href="/"
            className="footer-wordmark"
            aria-label="Emmanuel Bitancor home"
          >
            <span className="footer-wordmark-name">ESB</span>
            <span className="footer-wordmark-dot">.</span>
            <span className="footer-wordmark-pixel display-pixel">
              &quot;Never Stop Learning.&quot;
            </span>
          </Link>
          <p className="footer-tagline">
            Building thoughtful, accessible and performant digital experiences.
          </p>
        </div>

        <div className="footer-groups">
          <div className="footer-group">
            <p className="footer-group-label eyebrow">index</p>
            <nav aria-label="Footer navigation" className="footer-nav">
              {navLinks.slice(1).map((item) => (
                <Link key={item.href} href={item.href} className="footer-link">
                  <span>{item.name}</span>
                  <span className="footer-link-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-group">
            <p className="footer-group-label eyebrow">elsewhere</p>
            <div className="footer-socials">
              <a
                href={EMAIL_MAILTO}
                className="footer-link"
                aria-label="Email Emmanuel"
              >
                <span>Email</span>
                <span className="footer-link-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
              <a
                href="https://github.com/emsanity-md"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
                aria-label="Emmanuel on GitHub"
              >
                <span>GitHub</span>
                <span className="footer-link-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
              <a
                href="https://www.linkedin.com/in/emmanuel-bitancor-40a582426"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
                aria-label="Emmanuel on LinkedIn"
              >
                <span>LinkedIn</span>
                <span className="footer-link-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
              <a href="#top" className="footer-link footer-link--top">
                <span>Top</span>
                <ArrowUp className="footer-top-icon" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="footer-legal">
        © {new Date().getFullYear()} Emmanuel Bitancor. All rights reserved.
      </p>
    </footer>
  );
}
