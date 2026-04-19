import WeatherDashboard from "@/components/weather-dashboard";
import {
  DEFAULT_CITY,
  STATIC_CITY_MAP,
  getWeatherByCity,
} from "@/lib/weather";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const requestedCity =
    typeof params.city === "string" && params.city.trim()
      ? params.city
      : DEFAULT_CITY;

  const weather = await getWeatherByCity(requestedCity, { mode: "dynamic" });

  return (
    <WeatherDashboard
      key={`ssr-${requestedCity.toLowerCase()}`}
      initialWeather={weather}
      initialCityQuery={requestedCity}
      renderMode="SSR"
      staticLinks={Object.entries(STATIC_CITY_MAP).map(([slug, city]) => ({
        slug,
        city,
      }))}
    />
  );
}
