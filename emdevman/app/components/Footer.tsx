import Link from "next/link";
import { ArrowUp } from "lucide-react";

import { EMAIL_MAILTO } from "../lib/contact";
import { navLinks } from "../lib/navigation";

/**
 * One markup, two designs. V2 keeps the wordmark, the tagline, the inline
 * nav and the circular icon buttons. v3 re-casts the same elements through
 * globals.css: a pixel wordmark, mono micro-labels over each group, and social
 * links as text with a trailing arrow rather than buttons.
 */
export default function Footer() {
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
