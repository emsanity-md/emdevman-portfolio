"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";

import { cn } from "@/app/lib/utils";
import { weatherLocation } from "@/app/lib/weather";

interface WeatherData {
  temperature: number;
  code: number;
  isDay: boolean;
}

interface WeatherResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

const weatherDescriptions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

function getWeatherPresentation(code: number, isDay: boolean) {
  if (code === 0) {
    return { label: weatherDescriptions[code], icon: isDay ? Sun : Moon };
  }

  if (code <= 3) {
    return { label: weatherDescriptions[code], icon: CloudSun };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: weatherDescriptions[code], icon: CloudRain };
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: weatherDescriptions[code], icon: CloudSnow };
  }

  if (code >= 95) {
    return { label: weatherDescriptions[code], icon: CloudLightning };
  }

  return { label: weatherDescriptions[code] ?? "Current conditions", icon: Cloud };
}

/**
 * The weather half of the old `ProfileContext` chip, mounted inside the profile
 * card at the bottom of the hero portrait.
 *
 * This was `app/components/ui/ProfileContext.tsx` and it rendered two things: a
 * Manila clock and the weather. The clock is gone, and that is the reason this
 * is a new file rather than an edit:
 *
 *   - The hero already carries a clock, in the status line next to "Available
 *     for work", which is where the design brief put it. Keeping the chip's copy
 *     would put the same time on screen twice, about 400px apart.
 *   - The two were not the same widget. This one rendered `9:07 PM` plus the
 *     date; `v2/components/LocalClock.tsx` renders one token and schedules its
 *     tick to the next minute boundary rather than to a flat 30 seconds.
 *
 * So the chip is weather-only and the clock lives once, in the status line.
 * `LocalClock` reads its timezone from `lib/weather.ts`, the same module this
 * fetch uses, so the two cannot disagree about where "local" is.
 *
 * The request is to `api.open-meteo.com` and happens on every page load. It is
 * unauthenticated, needs no key, and is cached by nothing - so when it fails
 * the chip says so in one short line rather than disappearing, which would leave
 * a hole in the card. The fetch is abortable and the interval is cleared on
 * unmount, so navigating away mid-request does not warn.
 */
export function WeatherChip({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const fetchWeather = async () => {
      const params = new URLSearchParams({
        latitude: String(weatherLocation.latitude),
        longitude: String(weatherLocation.longitude),
        current: "temperature_2m,weather_code,is_day",
        timezone: weatherLocation.timezone,
      });

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Weather request failed");

        const result = (await response.json()) as WeatherResponse;
        const current = result.current;
        if (
          !active ||
          current?.temperature_2m === undefined ||
          current.weather_code === undefined
        ) {
          throw new Error("Weather response was incomplete");
        }

        setWeather({
          temperature: current.temperature_2m,
          code: current.weather_code,
          isDay: current.is_day !== 0,
        });
        setFailed(false);
      } catch (error) {
        // An abort is this component going away, not a failure to report.
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setFailed(true);
      }
    };

    void fetchWeather();
    const interval = window.setInterval(fetchWeather, 15 * 60 * 1000);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const presentation = weather ? getWeatherPresentation(weather.code, weather.isDay) : null;
  const Icon = presentation?.icon ?? Cloud;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[0.75rem] border border-border bg-background/85 px-3 py-2 backdrop-blur-sm",
        className,
      )}
      title={`Current conditions in ${weatherLocation.name}`}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

      <p className="font-mono text-micro uppercase tracking-[0.12em] text-muted-foreground">
        {weather ? presentation?.label : failed ? "Unavailable" : "Loading"}
      </p>

      <p className="ml-auto font-mono text-micro text-foreground">
        {weather ? `${Math.round(weather.temperature)}°C` : "—"}
      </p>
    </div>
  );
}