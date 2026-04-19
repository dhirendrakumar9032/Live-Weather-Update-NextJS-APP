import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/lib/weather";

export type WeatherSyncStatus = "healthy" | "syncing" | "degraded";

type UseWeatherPollingArgs = {
  initialSnapshot: WeatherSnapshot;
  cityQuery: string;
  intervalMs?: number;
};

type UseWeatherPollingResult = {
  weather: WeatherSnapshot;
  syncStatus: WeatherSyncStatus;
};

const DEFAULT_POLLING_INTERVAL = 60_000;

export function useWeatherPolling({
  initialSnapshot,
  cityQuery,
  intervalMs = DEFAULT_POLLING_INTERVAL,
}: UseWeatherPollingArgs): UseWeatherPollingResult {
  const [weather, setWeather] = useState(() => initialSnapshot);
  const [syncStatus, setSyncStatus] = useState<WeatherSyncStatus>("healthy");

  useEffect(() => {
    let isCurrent = true;

    const refreshWeather = async () => {
      if (!isCurrent) {
        return;
      }

      setSyncStatus("syncing");

      try {
        const response = await fetch(
          `/api/weather?city=${encodeURIComponent(cityQuery)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Weather refresh failed with status ${response.status}.`);
        }

        const nextSnapshot = (await response.json()) as WeatherSnapshot;

        if (!isCurrent) {
          return;
        }

        setWeather(nextSnapshot);
        setSyncStatus("healthy");
      } catch {
        if (isCurrent) {
          setSyncStatus("degraded");
        }
      }
    };

    const intervalId = window.setInterval(refreshWeather, intervalMs);

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [cityQuery, intervalMs]);

  return {
    weather,
    syncStatus,
  };
}
