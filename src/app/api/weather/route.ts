import { NextResponse } from "next/server";
import { DEFAULT_CITY, getWeatherByCity } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cityQuery = requestUrl.searchParams.get("city")?.trim() || DEFAULT_CITY;

  try {
    const weather = await getWeatherByCity(cityQuery, { mode: "dynamic" });

    return NextResponse.json(weather, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch weather data right now." },
      { status: 500 }
    );
  }
}
