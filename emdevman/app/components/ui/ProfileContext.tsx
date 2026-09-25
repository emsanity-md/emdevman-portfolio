"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Clock3,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

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

interface WeatherPresentation {
  label: string;
  icon: LucideIcon;
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

function getWeatherPresentation(code: number, isDay: boolean): WeatherPresentation {
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

export default function ProfileContext() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: weatherLocation.timezone,
      }),
    [],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: weatherLocation.timezone,
      }),
    [],
  );

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

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
        if (!active || !current || current.temperature_2m === undefined || current.weather_code === undefined) {
          throw new Error("Weather response was incomplete");
        }

        setWeather({
          temperature: current.temperature_2m,
          code: current.weather_code,
          isDay: current.is_day !== 0,
        });
        setWeatherError(false);
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setWeatherError(true);
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

  const weatherPresentation = weather
    ? getWeatherPresentation(weather.code, weather.isDay)
    : null;
  const WeatherIcon = weatherPresentation?.icon ?? Cloud;

  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-3 z-40 rounded-2xl border border-white/20 bg-zinc-950/45 p-3 text-white shadow-lg backdrop-blur-md"
      style={{ transform: "translateZ(55px)" }}
      title={`Live conditions in ${weatherLocation.name}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-white/65">
            <Clock3 className="size-3.5" aria-hidden="true" />
            <span className="font-mono text-micro uppercase tracking-[0.14em]">Local time</span>
          </div>
          <p suppressHydrationWarning className="mt-1 text-sm font-semibold">
            {now ? timeFormatter.format(now) : "--:--"}
          </p>
          <p suppressHydrationWarning className="truncate text-micro text-white/60">
            {now ? dateFormatter.format(now) : "Loading date"}
          </p>
        </div>

        <div className="h-9 w-px bg-white/20" aria-hidden="true" />

        <div className="min-w-0 text-right">
          <div className="flex items-center justify-end gap-1.5 text-white/65">
            <span className="truncate font-mono text-micro uppercase tracking-[0.14em]">
              {weatherPresentation?.label ?? (weatherError ? "Unavailable" : "Loading weather")}
            </span>
            <WeatherIcon className="size-3.5 shrink-0" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm font-semibold">
            {weather ? `${Math.round(weather.temperature)}°C` : weatherError ? "—" : "—°"}
          </p>
          <p className="truncate text-micro text-white/60">{weatherLocation.name}</p>
        </div>
      </div>
    </div>
  );
}
