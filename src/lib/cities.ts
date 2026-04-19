export const DEFAULT_CITY = "Delhi";

export const FEATURED_CITIES = [
  { slug: "delhi", city: "Delhi" },
  { slug: "mumbai", city: "Mumbai" },
  { slug: "lucknow", city: "Lucknow" },
  { slug: "barabanki", city: "Barabanki" },
  { slug: "hyderabad", city: "Hyderabad" },
  { slug: "bangalore", city: "Bangalore" },
] as const;

export type CityLink = (typeof FEATURED_CITIES)[number];
export type FeaturedCitySlug = CityLink["slug"];

const CITY_LINKS = FEATURED_CITIES;

const staticCityMap = {} as Record<FeaturedCitySlug, string>;
for (const city of CITY_LINKS) {
  staticCityMap[city.slug] = city.city;
}

export const STATIC_CITY_MAP = staticCityMap;

export const STATIC_CITY_LINKS = CITY_LINKS;

export const isFeaturedCitySlug = (
  slug: string
): slug is FeaturedCitySlug =>
  Object.prototype.hasOwnProperty.call(STATIC_CITY_MAP, slug);

export const getFeaturedCityName = (slug: string) =>
  isFeaturedCitySlug(slug) ? STATIC_CITY_MAP[slug] : null;

export const getStaticCityParams = (): Array<{ slug: FeaturedCitySlug }> =>
  STATIC_CITY_LINKS.map((city) => ({ slug: city.slug }));
