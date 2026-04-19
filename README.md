# Mausam Update

Mausam Studio is a weather dashboard built with Next.js App Router.

<img width="1470" height="800" alt="image" src="https://github.com/user-attachments/assets/864cec69-7c5b-494c-bbb1-5bfcfa787677" />


It demonstrates a practical hybrid rendering setup:
- SSR for city search on the home route
- SSG + ISR for pre-generated featured city pages
- A dynamic API route for live refresh in the client

## Highlights

- Real-time weather snapshots from Open-Meteo
- No API key required
- Clean fallback behavior when external APIs are unreachable
- Responsive, mobile-friendly dashboard layout
- Strong TypeScript typing across routes, service layer, and UI

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS Modules
- ESLint

## Rendering Strategy

- `/`
  - SSR (`dynamic = "force-dynamic"`)
  - Accepts `?city=` query param
  - Always fetches fresh weather on request

- `/city/[slug]`
  - SSG with ISR (`revalidate = 1800`)
  - Static params are generated from featured cities
  - Best for predictable high-traffic city pages

- `/api/weather?city=...`
  - Dynamic API endpoint
  - Used by the client polling hook for live refresh
  - Response is set to `no-store`

## Project Structure

```text
src/
  app/
    api/weather/route.ts        # Dynamic weather API route
    city/[slug]/page.tsx        # SSG + ISR featured city page
    globals.css                 # Global tokens and base styles
    layout.tsx                  # App metadata and root layout
    page.tsx                    # SSR home page
  components/
    use-weather-polling.ts      # Client polling hook
    weather-dashboard.tsx       # Main weather UI
    weather-dashboard.module.css
  lib/
    cities.ts                   # City config and helpers
    weather.constants.ts        # Weather code map + endpoints
    weather.types.ts            # Shared domain types
    weather.ts                  # Weather service (public API)
```

## Data Flow

1. Route resolves city name (`/` query or `/city/[slug]`).
2. `getWeatherByCity` resolves coordinates from geocoding API.
3. Forecast API returns current, hourly, and daily weather.
4. Service normalizes response into `WeatherSnapshot`.
5. Dashboard renders initial snapshot from server response.
6. Client hook polls `/api/weather` every 60 seconds.

If any API step fails, the service returns a deterministic fallback snapshot so the UI remains stable.

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks

## Featured Static City Routes

- `/city/delhi`
- `/city/mumbai`
- `/city/lucknow`
- `/city/barabanki`
- `/city/hyderabad`
- `/city/bangalore`

## Example API Usage

```bash
curl "http://localhost:3000/api/weather?city=Pune"
```

## Customization Guide

- Add or remove featured cities in `src/lib/cities.ts`
- Update weather condition labels/icons in `src/lib/weather.constants.ts`
- Change polling behavior in `src/components/use-weather-polling.ts`
- Tune global theme tokens in `src/app/globals.css`

## Reliability Notes

- Geocoding failures automatically fall back to default city lookup.
- Forecast failures return synthetic fallback weather data.
- UI remains usable even when live sync is temporarily unavailable.

## License

For personal and learning use. Add your preferred license if distributing publicly.
