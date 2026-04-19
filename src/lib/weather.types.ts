export type WeatherFetchMode = "dynamic" | "static";

export type WeatherFetchOptions = {
  mode?: WeatherFetchMode;
  revalidate?: number;
};

export type WeatherSource = "live" | "fallback";

export type WeatherCity = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type WeatherCurrent = {
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

export type WeatherHourlyPoint = {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
};

export type WeatherDailyPoint = {
  date: string;
  max: number;
  min: number;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
};

export type WeatherSnapshot = {
  city: WeatherCity;
  current: WeatherCurrent;
  hourly: WeatherHourlyPoint[];
  daily: WeatherDailyPoint[];
  generatedAt: string;
  source: WeatherSource;
};

export type WeatherCondition = {
  label: string;
  icon: string;
};
