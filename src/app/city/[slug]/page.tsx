import { notFound } from "next/navigation";
import WeatherDashboard from "@/components/weather-dashboard";
import {
  getStaticCityParams,
  STATIC_CITY_LINKS,
  getFeaturedCityName,
  isFeaturedCitySlug,
} from "@/lib/cities";
import { getWeatherByCity } from "@/lib/weather";

export const dynamicParams = false;
export const revalidate = 1800;

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getStaticCityParams();
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;

  if (!isFeaturedCitySlug(slug)) {
    notFound();
  }
  const cityName = getFeaturedCityName(slug);
  if (!cityName) {
    notFound();
  }

  const weather = await getWeatherByCity(cityName, {
    mode: "static",
    revalidate,
  });

  return (
    <WeatherDashboard
      key={`ssg-${slug}`}
      initialWeather={weather}
      initialCityQuery={cityName}
      renderMode="SSG"
      staticLinks={STATIC_CITY_LINKS}
    />
  );
}
