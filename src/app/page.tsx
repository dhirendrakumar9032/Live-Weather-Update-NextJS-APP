import WeatherDashboard from "@/components/weather-dashboard";
import { DEFAULT_CITY, STATIC_CITY_LINKS } from "@/lib/cities";
import { getWeatherByCity } from "@/lib/weather";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ city?: string }>;
};

const resolveRequestedCity = (cityQuery?: string): string => {
  if (typeof cityQuery !== "string") {
    return DEFAULT_CITY;
  }

  const normalizedCity = cityQuery.trim();
  return normalizedCity || DEFAULT_CITY;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const requestedCity = resolveRequestedCity(params.city);

  const weather = await getWeatherByCity(requestedCity, { mode: "dynamic" });

  return (
    <WeatherDashboard
      key={`ssr-${requestedCity.toLowerCase()}`}
      initialWeather={weather}
      initialCityQuery={requestedCity}
      renderMode="SSR"
      staticLinks={STATIC_CITY_LINKS}
    />
  );
}
