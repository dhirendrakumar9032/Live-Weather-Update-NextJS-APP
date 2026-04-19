export const DEFAULT_CITY = "Delhi";

export const STATIC_CITY_MAP = {
  delhi: "Delhi",
  mumbai: "Mumbai",
  lucknow: "Lucknow",
  barabanki: "Barabanki",
  hyderabad: "Hyderabad",
  bangalore: "Bangalore",
} as const;

type FetchMode = "dynamic" | "static";

export type WeatherFetchOptions = {
  mode?: FetchMode;
  revalidate?: number;
};

type Condition = {
  label: string;
  icon: string;
};

type GeocodingResult = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  timezone: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type ForecastResponse = {
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

export type WeatherSnapshot = {
  city: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    weatherLabel: string;
    weatherIcon: string;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
    weatherLabel: string;
    weatherIcon: string;
  }>;
  daily: Array<{
    date: string;
    max: number;
    min: number;
    weatherCode: number;
    weatherLabel: string;
    weatherIcon: string;
  }>;
  generatedAt: string;
  source: "live" | "fallback";
};

const WEATHER_CODES: Record<number, Condition> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  56: { label: "Freezing drizzle", icon: "🌧️" },
  57: { label: "Dense freezing drizzle", icon: "🌧️" },
  61: { label: "Slight rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌨️" },
  67: { label: "Heavy freezing rain", icon: "🌨️" },
  71: { label: "Slight snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Violent showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "🌨️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "⛈️" },
};

const DEFAULT_CONDITION: Condition = {
  label: "Unknown",
  icon: "🌡️",
};

const sanitizeCity = (city: string) => city.trim().replace(/\s+/g, " ");

const getCondition = (code: number): Condition =>
  WEATHER_CODES[code] ?? DEFAULT_CONDITION;

const getFetchInit = (
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
    ...getFetchInit(options),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

async function resolveCity(
  cityQuery: string,
  options: WeatherFetchOptions
): Promise<GeocodingResult> {
  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", cityQuery);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", "en");
  geocodeUrl.searchParams.set("format", "json");

  const data = await fetchJson<GeocodingResponse>(geocodeUrl.toString(), {
    ...options,
    mode: options.mode === "dynamic" ? "dynamic" : "static",
    revalidate: options.revalidate ?? 86400,
  });

  const location = data.results?.[0];
  if (!location) {
    throw new Error(`No city found for query "${cityQuery}"`);
  }

  return location;
}

async function fetchForecast(
  location: GeocodingResult,
  options: WeatherFetchOptions
): Promise<ForecastResponse> {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(location.latitude));
  forecastUrl.searchParams.set("longitude", String(location.longitude));
  forecastUrl.searchParams.set("timezone", location.timezone);
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

  return fetchJson<ForecastResponse>(forecastUrl.toString(), options);
}

function buildFallbackSnapshot(cityName: string): WeatherSnapshot {
  const now = new Date();
  const startingHour = new Date(now);
  startingHour.setMinutes(0, 0, 0);

  const hourlyCodes = [0, 1, 2, 3, 61, 63, 80, 45];
  const dailyCodes = [0, 2, 3, 61, 80, 95, 1];

  const hourly = Array.from({ length: 48 }, (_, index) => {
    const currentDate = new Date(startingHour.getTime() + index * 3600000);
    const weatherCode = hourlyCodes[index % hourlyCodes.length];
    const condition = getCondition(weatherCode);

    return {
      time: currentDate.toISOString(),
      temperature: 16 + ((index * 3) % 12),
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    };
  });

  const daily = Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(startingHour);
    currentDate.setDate(startingHour.getDate() + index);
    const weatherCode = dailyCodes[index % dailyCodes.length];
    const condition = getCondition(weatherCode);
    const baseTemp = 19 + index;

    return {
      date: currentDate.toISOString().slice(0, 10),
      max: baseTemp + 4,
      min: baseTemp - 3,
      weatherCode,
      weatherLabel: condition.label,
      weatherIcon: condition.icon,
    };
  });

  const currentCode = hourly[0]?.weatherCode ?? 0;
  const currentCondition = getCondition(currentCode);

  return {
    city: {
      name: cityName || DEFAULT_CITY,
      country: "India",
      latitude: 0,
      longitude: 0,
      timezone: "IST",
    },
    current: {
      time: now.toISOString(),
      temperature: hourly[0]?.temperature ?? 20,
      apparentTemperature: (hourly[0]?.temperature ?? 20) - 1,
      humidity: 58,
      windSpeed: 12,
      precipitation: 0,
      weatherCode: currentCode,
      weatherLabel: currentCondition.label,
      weatherIcon: currentCondition.icon,
    },
    hourly,
    daily,
    generatedAt: now.toISOString(),
    source: "fallback",
  };
}

export async function getWeatherByCity(
  cityInput: string,
  options: WeatherFetchOptions = {}
): Promise<WeatherSnapshot> {
  const cityQuery = sanitizeCity(cityInput || DEFAULT_CITY) || DEFAULT_CITY;

  try {
    let city = await resolveCity(cityQuery, options).catch(async () => {
      if (cityQuery === DEFAULT_CITY) {
        throw new Error("Unable to resolve city data.");
      }

      return resolveCity(DEFAULT_CITY, options);
    });

    const forecast = await fetchForecast(city, options);

    if (!forecast.current || !forecast.hourly || !forecast.daily) {
      throw new Error("Weather data response is incomplete.");
    }

    const currentCode =
      forecast.current.weather_code ?? forecast.current.weathercode ?? 0;
    const currentCondition = getCondition(currentCode);

    const hourlyCodes =
      forecast.hourly.weather_code ?? forecast.hourly.weathercode ?? [];
    const hourly = (forecast.hourly.time ?? []).map((time, index) => {
      const code = Number(hourlyCodes[index] ?? 0);
      const condition = getCondition(code);

      return {
        time,
        temperature: Number(forecast.hourly?.temperature_2m?.[index] ?? 0),
        weatherCode: code,
        weatherLabel: condition.label,
        weatherIcon: condition.icon,
      };
    });

    const dailyCodes =
      forecast.daily.weather_code ?? forecast.daily.weathercode ?? [];
    const daily = (forecast.daily.time ?? []).map((date, index) => {
      const code = Number(dailyCodes[index] ?? 0);
      const condition = getCondition(code);

      return {
        date,
        max: Number(forecast.daily?.temperature_2m_max?.[index] ?? 0),
        min: Number(forecast.daily?.temperature_2m_min?.[index] ?? 0),
        weatherCode: code,
        weatherLabel: condition.label,
        weatherIcon: condition.icon,
      };
    });

    city = {
      ...city,
      name: city.name || DEFAULT_CITY,
      country: city.country || "",
      timezone: city.timezone || "auto",
    };

    return {
      city: {
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      },
      current: {
        time: forecast.current.time ?? new Date().toISOString(),
        temperature: Number(forecast.current.temperature_2m ?? 0),
        apparentTemperature: Number(forecast.current.apparent_temperature ?? 0),
        humidity: Number(forecast.current.relative_humidity_2m ?? 0),
        windSpeed: Number(forecast.current.wind_speed_10m ?? 0),
        precipitation: Number(forecast.current.precipitation ?? 0),
        weatherCode: currentCode,
        weatherLabel: currentCondition.label,
        weatherIcon: currentCondition.icon,
      },
      hourly,
      daily,
      generatedAt: new Date().toISOString(),
      source: "live",
    };
  } catch {
    return buildFallbackSnapshot(cityQuery);
  }
}
