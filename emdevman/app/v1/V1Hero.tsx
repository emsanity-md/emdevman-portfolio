import Image from "next/image";

import profileImage from "../assets/images/PROFILE-IMAGE-NO-BG.png";

import { v1Socials } from "./sections";

/**
 * v1's hero: the photograph on the left, the header on the right.
 *
 * The one place v1 uses an image, and it is a plain `<Image>` with a max width -
 * no card, no plate, no halftone mask, and none of the pointer-drift behaviour
 * that `Portrait` adds. Stacks image-first below 768px, which keeps the reading
 * order (who this is, then what they do) intact at every width.
 */
export function V1Hero() {
  return (
    <section id="home" className="v1-hero">
      <Image
        src={profileImage}
        alt="Emmanuel Bitancor"
        priority
        className="v1-hero-image"
        sizes="(max-width: 767px) 22rem, 30vw"
      />

      <div>
        <p className="v1-label">Full-stack developer</p>

        <h1 className="v1-display v1-hero-name mt-5">Emmanuel Bitancor</h1>

        <div className="mt-7 space-y-4 text-[1.0625rem] leading-8 text-muted-foreground">
          <p className="max-w-[34rem]">
            I build modern web and mobile apps, and these days I&apos;m focused on
            Networking. I like taking a rough idea and turning it into
            something people actually want to use.
          </p>
        </div>

        <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
          {v1Socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="v1-label text-foreground"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
