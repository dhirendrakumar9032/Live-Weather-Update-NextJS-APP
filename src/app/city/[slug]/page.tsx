import { notFound } from "next/navigation";
import WeatherDashboard from "@/components/weather-dashboard";
import {
  STATIC_CITY_MAP,
  getWeatherByCity,
  type WeatherFetchOptions,
} from "@/lib/weather";

export const dynamicParams = false;
export const revalidate = 1800;

type StaticCitySlug = keyof typeof STATIC_CITY_MAP;

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(STATIC_CITY_MAP).map((slug) => ({ slug }));
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const cityName = STATIC_CITY_MAP[slug as StaticCitySlug];

  if (!cityName) {
    notFound();
  }

  const weather = await getWeatherByCity(cityName, {
    mode: "static",
    revalidate,
  } satisfies WeatherFetchOptions);

  return (
    <WeatherDashboard
      key={`ssg-${slug}`}
      initialWeather={weather}
      initialCityQuery={cityName}
      renderMode="SSG"
      staticLinks={Object.entries(STATIC_CITY_MAP).map(([citySlug, city]) => ({
        slug: citySlug,
        city,
      }))}
    />
  );
}
