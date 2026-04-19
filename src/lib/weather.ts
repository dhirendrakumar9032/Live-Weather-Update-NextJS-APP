import { DEFAULT_CITY } from "./cities";
import {
  DEFAULT_TIMEZONE,
  FALLBACK_CONDITION,
  FORECAST_API_URL,
  GEO_API_URL,
  WEATHER_CODE_MAP,
} from "./weather.constants";
import type {
  WeatherCondition,
  WeatherCurrent,
  WeatherDailyPoint,
  WeatherFetchOptions,
  WeatherHourlyPoint,
  WeatherSnapshot,
} from "./weather.types";

export { DEFAULT_CITY, STATIC_CITY_LINKS, STATIC_CITY_MAP } from "./cities";
export type {
  WeatherFetchMode,
  WeatherFetchOptions,
  WeatherSource,
  WeatherCity,
  WeatherCurrent,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  WeatherSnapshot,
} from "./weather.types";

type GeocodeApiResult = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  timezone: string;
};

type GeocodeApiResponse = {
  results?: GeocodeApiResult[];
};

type ForecastApiResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    weather_code?: number;
    weathercode?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    weathercode?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    weathercode?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  timezone: string;
};

const FALLBACK_HOURLY_CODES = [0, 1, 2, 3, 61, 63, 80, 45];
const FALLBACK_DAILY_CODES = [0, 2, 3, 61, 80, 95, 1];

const normalizeCityName = (input: string): string =>
  input.trim().replace(/\s+/g, " ");

const toNumber = (value: unknown, fallbackValue = 0): number => {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

const getWeatherCondition = (code: number): WeatherCondition =>
  WEATHER_CODE_MAP[code] ?? FALLBACK_CONDITION;

const createRequestInit = (
  options: WeatherFetchOptions
): RequestInit & { next?: { revalidate: number } } => {
  if (options.mode === "dynamic") {
    return { cache: "no-store" };
  }

  return {
    next: {
      revalidate: options.revalidate ?? 1800,
    },
  };
};

async function fetchJson<T>(
  url: string,
  options: WeatherFetchOptions
): Promise<T> {
  const response = await fetch(url, {
    ...createRequestInit(options),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

const createGeocodingUrl = (cityQuery: string): string => {
  const geocodingUrl = new URL(GEO_API_URL);
  geocodingUrl.searchParams.set("name", cityQuery);
  geocodingUrl.searchParams.set("count", "1");
  geocodingUrl.searchParams.set("language", "en");
  geocodingUrl.searchParams.set("format", "json");
  return geocodingUrl.toString();
};

const createForecastUrl = (location: ResolvedLocation): string => {
  const forecastUrl = new URL(FORECAST_API_URL);
  forecastUrl.searchParams.set("latitude", String(location.latitude));
  forecastUrl.searchParams.set("longitude", String(location.longitude));
  forecastUrl.searchParams.set("timezone", location.timezone || "auto");
  forecastUrl.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "precipitation",
      "weather_code",
    ].join(",")
  );
  forecastUrl.searchParams.set("hourly", "temperature_2m,weather_code");
  forecastUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min"
  );
  forecastUrl.searchParams.set("forecast_days", "7");
  forecastUrl.searchParams.set("temperature_unit", "celsius");
  forecastUrl.searchParams.set("wind_speed_unit", "kmh");

  return forecastUrl.toString();
};

async function resolveLocation(
  cityQuery: string,
  options: WeatherFetchOptions
): Promise<ResolvedLocation> {
  const geocodeResponse = await fetchJson<GeocodeApiResponse>(
    createGeocodingUrl(cityQuery),
    {
      ...options,
      mode: options.mode === "dynamic" ? "dynamic" : "static",
      revalidate: options.revalidate ?? 86400,
    }
  );

  const firstResult = geocodeResponse.results?.[0];
  if (!firstResult) {
    throw new Error(`No location found for city "${cityQuery}".`);
  }

  return {
    latitude: firstResult.latitude,
    longitude: firstResult.longitude,
    name: firstResult.name,
    country: firstResult.country,
    timezone: firstResult.timezone,
  };
}

async function resolveLocationWithFallback(
  cityQuery: string,
  options: WeatherFetchOptions
): Promise<ResolvedLocation> {
  try {
    return await resolveLocation(cityQuery, options);
  } catch {
    if (cityQuery === DEFAULT_CITY) {
      throw new Error("Unable to resolve default city.");
    }

    return resolveLocation(DEFAULT_CITY, options);
  }
}

async function fetchForecast(
  location: ResolvedLocation,
  options: WeatherFetchOptions
): Promise<ForecastApiResponse> {
  return fetchJson<ForecastApiResponse>(createForecastUrl(location), options);
}

const mapHourlyForecast = (
  hourly: ForecastApiResponse["hourly"]
): WeatherHourlyPoint[] => {
  if (!hourly?.time?.length) {
    return [];
  }

  const hourlyCodes = hourly.weather_code ?? hourly.weathercode ?? [];

  return hourly.time.map((time, index) => {
    const weatherCode = toNumber(hourlyCodes[index], 0);
    const condition = getWeatherCondition(weatherCode);

    return {
      time,
      temperature: toNumber(hourly.temperature_2m?.[index], 0),
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    };
  });
};

const mapDailyForecast = (
  daily: ForecastApiResponse["daily"]
): WeatherDailyPoint[] => {
  if (!daily?.time?.length) {
    return [];
  }

  const dailyCodes = daily.weather_code ?? daily.weathercode ?? [];

  return daily.time.map((date, index) => {
    const weatherCode = toNumber(dailyCodes[index], 0);
    const condition = getWeatherCondition(weatherCode);

    return {
      date,
      max: toNumber(daily.temperature_2m_max?.[index], 0),
      min: toNumber(daily.temperature_2m_min?.[index], 0),
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    };
  });
};

const mapCurrentWeather = (
  current: ForecastApiResponse["current"],
  generatedAt: string
): WeatherCurrent => {
  const weatherCode = toNumber(current?.weather_code ?? current?.weathercode, 0);
  const condition = getWeatherCondition(weatherCode);

  return {
    time: current?.time ?? generatedAt,
    temperature: toNumber(current?.temperature_2m, 0),
    apparentTemperature: toNumber(current?.apparent_temperature, 0),
    humidity: toNumber(current?.relative_humidity_2m, 0),
    windSpeed: toNumber(current?.wind_speed_10m, 0),
    precipitation: toNumber(current?.precipitation, 0),
    weatherCode,
    weatherLabel: condition.label,
    weatherIcon: condition.icon,
  };
};

const createFallbackHourly = (startHour: Date): WeatherHourlyPoint[] =>
  Array.from({ length: 48 }, (_, index) => {
    const slotTime = new Date(startHour.getTime() + index * 3600000);
    const weatherCode = FALLBACK_HOURLY_CODES[index % FALLBACK_HOURLY_CODES.length];
    const condition = getWeatherCondition(weatherCode);
    const syntheticTrend = Math.sin(index / 4) * 4;

    return {
      time: slotTime.toISOString(),
      temperature: 22 + syntheticTrend,
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    };
  });

const createFallbackDaily = (startHour: Date): WeatherDailyPoint[] =>
  Array.from({ length: 7 }, (_, index) => {
    const dayTime = new Date(startHour);
    dayTime.setDate(startHour.getDate() + index);

    const weatherCode = FALLBACK_DAILY_CODES[index % FALLBACK_DAILY_CODES.length];
    const condition = getWeatherCondition(weatherCode);
    const baseline = 25 + Math.sin(index) * 3;

    return {
      date: dayTime.toISOString().slice(0, 10),
      max: baseline + 4,
      min: baseline - 3,
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    };
  });

const createFallbackSnapshot = (cityName: string): WeatherSnapshot => {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  const hourly = createFallbackHourly(hourStart);
  const daily = createFallbackDaily(hourStart);
  const weatherCode = hourly[0]?.weatherCode ?? 0;
  const condition = getWeatherCondition(weatherCode);

  return {
    city: {
      name: cityName || DEFAULT_CITY,
      country: "India",
      latitude: 0,
      longitude: 0,
      timezone: DEFAULT_TIMEZONE,
    },
    current: {
      time: now.toISOString(),
      temperature: hourly[0]?.temperature ?? 24,
      apparentTemperature: (hourly[0]?.temperature ?? 24) - 1,
      humidity: 58,
      windSpeed: 12,
      precipitation: 0,
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    },
    hourly,
    daily,
    generatedAt: now.toISOString(),
    source: "fallback",
  };
};

function ensureForecastData(
  forecast: ForecastApiResponse
): asserts forecast is Required<ForecastApiResponse> {
  if (!forecast.current || !forecast.hourly || !forecast.daily) {
    throw new Error("Forecast response is incomplete.");
  }
}

export async function getWeatherByCity(
  cityInput: string,
  options: WeatherFetchOptions = {}
): Promise<WeatherSnapshot> {
  const cityQuery = normalizeCityName(cityInput || DEFAULT_CITY) || DEFAULT_CITY;

  try {
    const resolvedLocation = await resolveLocationWithFallback(cityQuery, options);
    const forecast = await fetchForecast(resolvedLocation, options);
    ensureForecastData(forecast);

    const generatedAt = new Date().toISOString();

    return {
      city: {
        name: resolvedLocation.name || DEFAULT_CITY,
        country: resolvedLocation.country || "",
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
        timezone: resolvedLocation.timezone || DEFAULT_TIMEZONE,
      },
      current: mapCurrentWeather(forecast.current, generatedAt),
      hourly: mapHourlyForecast(forecast.hourly),
      daily: mapDailyForecast(forecast.daily),
      generatedAt,
      source: "live",
    };
  } catch {
    return createFallbackSnapshot(cityQuery);
  }
}
