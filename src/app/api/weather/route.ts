import { NextResponse } from "next/server";
import { DEFAULT_CITY } from "@/lib/cities";
import { getWeatherByCity } from "@/lib/weather";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

const getCityFromRequest = (request: Request): string => {
  const requestUrl = new URL(request.url);
  const cityQuery = requestUrl.searchParams.get("city")?.trim();
  return cityQuery || DEFAULT_CITY;
};

export async function GET(request: Request) {
  const cityQuery = getCityFromRequest(request);

  try {
    const weather = await getWeatherByCity(cityQuery, { mode: "dynamic" });

    return NextResponse.json(weather, {
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch weather data right now." },
      { status: 500 }
    );
  }
}
