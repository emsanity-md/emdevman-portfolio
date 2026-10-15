"use client";

import { EMAIL_MAILTO } from "@/app/lib/contact";
import ProfileCard from "./ProfileCard";
import { useWeather } from "../useWeather";

/**
 * The profile card as it appears in the hero, with live conditions in its
 * status line.
 *
 * Exists as its own client component for one reason: the weather is a hook, and
 * a hook cannot be called from a server component. `V2Hero` is a server
 * component and should stay one - it is the page's largest static block, and
 * making the whole hero client-side to accommodate one fetch would put a
 * hydration boundary around all of it.
 *
 * So the island is this: a hook, and the card it feeds. Everything else in the
 * hero still ships as HTML.
 */
export function HeroProfileCard() {
  const weather = useWeather();

  const status =
    weather.temperature === null || weather.label === null
      ? (weather.label ?? "Loading")
      : `${weather.label} ${weather.temperature}°C`;

  return (
    <ProfileCard
      avatarUrl="/assets/images/profile3-4k.webp"
      alt="Emmanuel S. Bitancor"
      handle="emsanity-md"
      status={status}
      statusColor={weather.color}
      contactHref={EMAIL_MAILTO}
      contactText="Email"
      fit="contain"
    />
  );
}