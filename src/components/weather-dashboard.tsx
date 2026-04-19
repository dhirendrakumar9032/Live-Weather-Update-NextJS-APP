"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WeatherSnapshot } from "@/lib/weather";
import styles from "./weather-dashboard.module.css";

type WeatherDashboardProps = {
  initialWeather: WeatherSnapshot;
  initialCityQuery: string;
  renderMode: "SSR" | "SSG";
  staticLinks: Array<{ slug: string; city: string }>;
};

const POLLING_INTERVAL = 60000;

const formatFullDate = (dateValue: string, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(dateValue));

const formatDay = (dateValue: string, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(new Date(dateValue));

const formatHour = (dateValue: string, timezone: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(dateValue));

export default function WeatherDashboard({
  initialWeather,
  initialCityQuery,
  renderMode,
  staticLinks,
}: WeatherDashboardProps) {
  const [weather, setWeather] = useState(() => initialWeather);
  const [activeDate, setActiveDate] = useState(
    () => initialWeather.daily[0]?.date ?? ""
  );

  useEffect(() => {
    let isMounted = true;

    const refreshData = async () => {
      try {
        const response = await fetch(
          `/api/weather?city=${encodeURIComponent(initialCityQuery)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          return;
        }

        const nextWeather = (await response.json()) as WeatherSnapshot;
        if (isMounted) {
          setWeather(nextWeather);
          setActiveDate((previous) => {
            const stillExists = nextWeather.daily.some(
              (day) => day.date === previous
            );
            return stillExists ? previous : nextWeather.daily[0]?.date ?? "";
          });
        }
      } catch {
        // Ignore polling errors and keep the latest successful state.
      }
    };

    const timerId = window.setInterval(refreshData, POLLING_INTERVAL);
    return () => {
      isMounted = false;
      window.clearInterval(timerId);
    };
  }, [initialCityQuery]);

  const timezone = weather.city.timezone || "IST";
  const selectedDate = weather.daily.some((day) => day.date === activeDate)
    ? activeDate
    : weather.daily[0]?.date ?? "";

  const selectedDayHourly = useMemo(
    () =>
      weather.hourly
        .filter((hour) => hour.time.startsWith(selectedDate))
        .slice(0, 10),
    [weather.hourly, selectedDate]
  );

  const pageModeLabel =
    renderMode === "SSR"
      ? "SSR page: rendered fresh on every request"
      : "SSG page: pre-rendered with incremental updates";
  const dataSourceLabel =
    weather.source === "live"
      ? "Data source: Live Open-Meteo API"
      : "Data source: Fallback sample (API unavailable)";

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <form action="/" method="get" className={styles.searchBar}>
          <input
            type="text"
            name="city"
            className={styles.searchInput}
            placeholder="Search for a place..."
            defaultValue={initialCityQuery}
            aria-label="City name"
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        <div className={styles.modeBanner}>
          <span>{pageModeLabel}</span>
          <span>{dataSourceLabel}</span>
          <span>
            Last update:{" "}
            {new Intl.DateTimeFormat("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
              timeZone: timezone,
            }).format(new Date(weather.generatedAt))}
          </span>
        </div>

        <div className={styles.quickLinks}>
          {staticLinks.map((link) => (
            <Link key={link.slug} href={`/city/${link.slug}`} className={styles.quickLink}>
              {link.city}
            </Link>
          ))}
        </div>

        <div className={styles.layoutGrid}>
          <section className={styles.leftPanel}>
            <article className={styles.heroCard}>
              <div className={styles.heroText}>
                <p className={styles.location}>
                  {weather.city.name}, {weather.city.country}
                </p>
                <p className={styles.dateText}>
                  {formatFullDate(weather.current.time, timezone)}
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
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Feels Like</p>
                <p className={styles.metricValue}>
                  {Math.round(weather.current.apparentTemperature)}°
                </p>
              </article>
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Humidity</p>
                <p className={styles.metricValue}>{Math.round(weather.current.humidity)}%</p>
              </article>
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Wind</p>
                <p className={styles.metricValue}>{Math.round(weather.current.windSpeed)} km/h</p>
              </article>
              <article className={styles.metricCard}>
                <p className={styles.metricLabel}>Precipitation</p>
                <p className={styles.metricValue}>
                  {weather.current.precipitation.toFixed(1)} mm
                </p>
              </article>
            </div>

            <section className={styles.dailySection}>
              <h2 className={styles.sectionTitle}>Daily forecast</h2>
              <div className={styles.dailyGrid}>
                {weather.daily.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={`${styles.dailyCard} ${
                      selectedDate === day.date ? styles.dailyCardActive : ""
                    }`}
                    onClick={() => setActiveDate(day.date)}
                  >
                    <p className={styles.dayName}>{formatDay(day.date, timezone)}</p>
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
              <h2 className={styles.sectionTitle}>Hourly forecast</h2>
              <select
                value={selectedDate}
                onChange={(event) => setActiveDate(event.target.value)}
                className={styles.daySelect}
              >
                {weather.daily.map((day) => (
                  <option key={day.date} value={day.date}>
                    {formatDay(day.date, timezone)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.hourlyList}>
              {selectedDayHourly.map((hour) => (
                <article className={styles.hourlyRow} key={hour.time}>
                  <div className={styles.hourlyInfo}>
                    <span className={styles.hourlyIcon}>{hour.weatherIcon}</span>
                    <span className={styles.hourlyTime}>{formatHour(hour.time, timezone)}</span>
                  </div>
                  <p className={styles.hourlyTemp}>{Math.round(hour.temperature)}°</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
