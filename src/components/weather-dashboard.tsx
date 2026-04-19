"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WeatherSnapshot } from "@/lib/weather";
import { useWeatherPolling, type WeatherSyncStatus } from "./use-weather-polling";
import styles from "./weather-dashboard.module.css";

type WeatherDashboardProps = {
  initialWeather: WeatherSnapshot;
  initialCityQuery: string;
  renderMode: "SSR" | "SSG";
  staticLinks: ReadonlyArray<{ slug: string; city: string }>;
};

type MetricCard = {
  label: string;
  value: string;
};

const DEFAULT_TIME_ZONE = "Asia/Kolkata";

const formatInTimeZone = (
  dateValue: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions
): string =>
  new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: timezone,
  }).format(new Date(dateValue));

const formatLongDate = (dateValue: string, timezone: string): string =>
  formatInTimeZone(dateValue, timezone, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDayName = (dateValue: string, timezone: string): string =>
  formatInTimeZone(dateValue, timezone, {
    weekday: "short",
  });

const formatHour = (dateValue: string, timezone: string): string =>
  formatInTimeZone(dateValue, timezone, {
    hour: "numeric",
    hour12: true,
  });

const formatLastUpdatedTime = (dateValue: string, timezone: string): string =>
  formatInTimeZone(dateValue, timezone, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const getModeLabel = (renderMode: "SSR" | "SSG"): string =>
  renderMode === "SSR"
    ? "SSR: server-rendered on each request"
    : "SSG: static generation with ISR refresh";

const getSourceLabel = (source: WeatherSnapshot["source"]): string =>
  source === "live"
    ? "Source: Open-Meteo live feed"
    : "Source: Local fallback data";

const getSyncLabel = (syncStatus: WeatherSyncStatus): string => {
  if (syncStatus === "syncing") {
    return "Sync: refreshing";
  }

  if (syncStatus === "degraded") {
    return "Sync: paused";
  }

  return "Sync: healthy";
};

const getMetricCards = (snapshot: WeatherSnapshot): MetricCard[] => [
  {
    label: "Feels Like",
    value: `${Math.round(snapshot.current.apparentTemperature)}°`,
  },
  {
    label: "Humidity",
    value: `${Math.round(snapshot.current.humidity)}%`,
  },
  {
    label: "Wind",
    value: `${Math.round(snapshot.current.windSpeed)} km/h`,
  },
  {
    label: "Precipitation",
    value: `${snapshot.current.precipitation.toFixed(1)} mm`,
  },
];

export default function WeatherDashboard({
  initialWeather,
  initialCityQuery,
  renderMode,
  staticLinks,
}: WeatherDashboardProps) {
  const { weather, syncStatus } = useWeatherPolling({
    initialSnapshot: initialWeather,
    cityQuery: initialCityQuery,
  });

  const [activeDate, setActiveDate] = useState(
    () => initialWeather.daily[0]?.date ?? ""
  );

  const timezone = weather.city.timezone || DEFAULT_TIME_ZONE;
  const selectedDate = weather.daily.some((day) => day.date === activeDate)
    ? activeDate
    : weather.daily[0]?.date ?? "";

  const hourlyForSelectedDate = useMemo(
    () =>
      weather.hourly
        .filter((hour) => hour.time.startsWith(selectedDate))
        .slice(0, 12),
    [selectedDate, weather.hourly]
  );

  const metrics = getMetricCards(weather);

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.topBar}>
          <form action="/" method="get" className={styles.searchBar}>
            <input
              type="text"
              name="city"
              className={styles.searchInput}
              placeholder="Search a city (e.g. Pune, Singapore)"
              defaultValue={initialCityQuery}
              aria-label="City name"
            />
            <button type="submit" className={styles.searchButton}>
              Check Weather
            </button>
          </form>

          <nav className={styles.quickLinks} aria-label="Featured cities">
            {staticLinks.map((link) => (
              <Link key={link.slug} href={`/city/${link.slug}`} className={styles.quickLink}>
                {link.city}
              </Link>
            ))}
          </nav>
        </header>

        <div className={styles.modeBanner}>
          <p className={styles.bannerItem}>{getModeLabel(renderMode)}</p>
          <p className={styles.bannerItem}>{getSourceLabel(weather.source)}</p>
          <p
            className={`${styles.bannerItem} ${
              syncStatus === "degraded" ? styles.bannerStale : styles.bannerLive
            }`}
          >
            {getSyncLabel(syncStatus)}
          </p>
          <p className={styles.bannerItem}>
            Updated at {formatLastUpdatedTime(weather.generatedAt, timezone)}
          </p>
        </div>

        <div className={styles.layoutGrid}>
          <section className={styles.leftPanel}>
            <article className={styles.heroCard}>
              <div className={styles.heroText}>
                <p className={styles.location}>
                  {weather.city.name}, {weather.city.country}
                </p>
                <p className={styles.dateText}>
                  {formatLongDate(weather.current.time, timezone)}
                </p>
                <p className={styles.condition}>{weather.current.weatherLabel}</p>
              </div>

              <div className={styles.heroTempWrap}>
                <span className={styles.heroIcon}>{weather.current.weatherIcon}</span>
                <span className={styles.heroTemp}>
                  {Math.round(weather.current.temperature)}°
                </span>
              </div>
            </article>

            <div className={styles.metricsGrid}>
              {metrics.map((metric) => (
                <article key={metric.label} className={styles.metricCard}>
                  <p className={styles.metricLabel}>{metric.label}</p>
                  <p className={styles.metricValue}>{metric.value}</p>
                </article>
              ))}
            </div>

            <section className={styles.dailySection}>
              <h2 className={styles.sectionTitle}>7-Day Forecast</h2>
              <div className={styles.dailyGrid}>
                {weather.daily.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={`${styles.dailyCard} ${
                      selectedDate === day.date ? styles.dailyCardActive : ""
                    }`}
                    onClick={() => setActiveDate(day.date)}
                    aria-pressed={selectedDate === day.date}
                  >
                    <p className={styles.dayName}>{formatDayName(day.date, timezone)}</p>
                    <p className={styles.dayIcon}>{day.weatherIcon}</p>
                    <p className={styles.dayTemps}>
                      <span>{Math.round(day.max)}°</span>
                      <span>{Math.round(day.min)}°</span>
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className={styles.rightPanel}>
            <div className={styles.hourlyHeader}>
              <h2 className={styles.sectionTitle}>Hourly Forecast</h2>
              <select
                value={selectedDate}
                onChange={(event) => setActiveDate(event.target.value)}
                className={styles.daySelect}
                aria-label="Select forecast day"
              >
                {weather.daily.map((day) => (
                  <option key={day.date} value={day.date}>
                    {formatDayName(day.date, timezone)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.hourlyList}>
              {hourlyForSelectedDate.length > 0 ? (
                hourlyForSelectedDate.map((hour) => (
                  <article className={styles.hourlyRow} key={hour.time}>
                    <div className={styles.hourlyInfo}>
                      <span className={styles.hourlyIcon}>{hour.weatherIcon}</span>
                      <span className={styles.hourlyTime}>
                        {formatHour(hour.time, timezone)}
                      </span>
                    </div>
                    <p className={styles.hourlyTemp}>{Math.round(hour.temperature)}°</p>
                  </article>
                ))
              ) : (
                <p className={styles.emptyState}>Hourly data is unavailable for this day.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
