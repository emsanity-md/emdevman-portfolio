"use client";

import { useEffect, useState } from "react";

import { weatherLocation } from "@/app/lib/weather";

export interface Weather {
  /** "Mainly clear", or null while loading or after a failure. */
  label: string | null;
  /** Whole degrees, or null. */
  temperature: number | null;
  /** Dot colour, from the condition rather than from the accent. */
  color: string;
  failed: boolean;
}

const CONDITIONS: Record<number, { label: string; color: string }> = {
  0: { label: "Clear sky", color: "#f59e0b" },
  1: { label: "Mainly clear", color: "#f59e0b" },
  2: { label: "Partly cloudy", color: "#94a3b8" },
  3: { label: "Overcast", color: "#94a3b8" },
  45: { label: "Foggy", color: "#94a3b8" },
  48: { label: "Rime fog", color: "#94a3b8" },
  51: { label: "Light drizzle", color: "#38bdf8" },
  53: { label: "Drizzle", color: "#38bdf8" },
  55: { label: "Heavy drizzle", color: "#38bdf8" },
  56: { label: "Freezing drizzle", color: "#38bdf8" },
  57: { label: "Heavy freezing drizzle", color: "#38bdf8" },
  61: { label: "Light rain", color: "#38bdf8" },
  63: { label: "Rain", color: "#38bdf8" },
  65: { label: "Heavy rain", color: "#38bdf8" },
  66: { label: "Freezing rain", color: "#38bdf8" },
  67: { label: "Heavy freezing rain", color: "#38bdf8" },
  71: { label: "Light snow", color: "#a5f3fc" },
  73: { label: "Snow", color: "#a5f3fc" },
  75: { label: "Heavy snow", color: "#a5f3fc" },
  77: { label: "Snow grains", color: "#a5f3fc" },
  80: { label: "Rain showers", color: "#38bdf8" },
  81: { label: "Heavy showers", color: "#38bdf8" },
  82: { label: "Violent showers", color: "#38bdf8" },
  85: { label: "Snow showers", color: "#a5f3fc" },
  86: { label: "Heavy snow showers", color: "#a5f3fc" },
  95: { label: "Thunderstorm", color: "#a78bfa" },
  96: { label: "Thunderstorm with hail", color: "#a78bfa" },
  99: { label: "Severe thunderstorm", color: "#a78bfa" },
};

/**
 * Live conditions where the work happens, for the profile card's status line.
 *
 * This is what `ProfileContext` used to be, minus the clock - the clock is in
 * the hero's availability line, where the brief put it, and having it here too
 * would put the same time on screen twice a few hundred pixels apart.
 *
 * A third-party request on every page load, so the failure path is a stated
 * condition rather than an absence: the card's status line says "Unavailable"
 * and the dot goes grey. Silently rendering nothing would leave the footer
 * looking broken for anyone on a network that blocks the API, or behind a
 * captive portal.
 *
 * `useWeather` and not a component, because the result feeds a prop rather than
 * a subtree - the card draws the status line itself, and a component here would
 * have to render a wrapper the card does not have a slot for.
 */
export function useWeather(): Weather {
  const [weather, setWeather] = useState<Omit<Weather, "failed"> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      const params = new URLSearchParams({
        latitude: String(weatherLocation.latitude),
        longitude: String(weatherLocation.longitude),
        current: "temperature_2m,weather_code",
        timezone: weatherLocation.timezone,
      });

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Weather request failed");

        const result = (await response.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
        };
        const current = result.current;
        if (!active || current?.temperature_2m === undefined || current.weather_code === undefined) {
          throw new Error("Weather response was incomplete");
        }

        setWeather({
          label: CONDITIONS[current.weather_code]?.label ?? "Current conditions",
          temperature: Math.round(current.temperature_2m),
          color: CONDITIONS[current.weather_code]?.color ?? "#94a3b8",
        });
        setFailed(false);
      } catch (error) {
        // An abort is this hook unmounting, which is not a failure to report.
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setFailed(true);
      }
    };

    void load();
    /*
      Fifteen minutes. Open-Meteo updates on a 15-minute cycle, so polling faster
      would fetch the same numbers repeatedly, and this runs on every page load
      whether or not anyone reads it.
    */
    const interval = window.setInterval(load, 15 * 60 * 1000);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  if (failed) return { label: "Unavailable", temperature: null, color: "#71717a", failed: true };
  if (!weather) return { label: "Loading", temperature: null, color: "#71717a", failed: false };

  return { ...weather, failed: false };
}