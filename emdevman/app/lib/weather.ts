const defaultLatitude = 14.5995;
const defaultLongitude = 120.9842;

function parseCoordinate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const weatherLocation = {
  name: process.env.NEXT_PUBLIC_WEATHER_CITY ?? "Manila, PH",
  latitude: parseCoordinate(process.env.NEXT_PUBLIC_WEATHER_LATITUDE, defaultLatitude),
  longitude: parseCoordinate(process.env.NEXT_PUBLIC_WEATHER_LONGITUDE, defaultLongitude),
  timezone: process.env.NEXT_PUBLIC_WEATHER_TIMEZONE ?? "Asia/Manila",
};
