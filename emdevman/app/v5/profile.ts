import { cvProfile } from "@/app/lib/cv";

/**
 * The one profile value the hero still needs.
 *
 * The feed that used these values - stats, avatars, rails, featured projects -
 * has been removed, so the file is now just the name the page signs itself
 * with. Keeping it here avoids a second spelling of the same name beside the
 * `cvProfile` source.
 */
export const V5_FULL_NAME = `${cvProfile.given} ${cvProfile.family}`;
