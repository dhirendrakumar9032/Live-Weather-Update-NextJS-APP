## SkyCast Live Weather (Next.js)

Weather dashboard inspired by your design reference.

- Uses free [Open-Meteo](https://open-meteo.com/) APIs (no key required)
- SSR on the homepage (`/`) with fresh weather on every request
- SSG on static city pages (`/city/[slug]`) with ISR revalidation
- Live updates on the client (polls `/api/weather` every 60 seconds)
- Search any city from the top bar

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` SSR weather dashboard
- `/city/berlin` SSG page
- `/city/london` SSG page
- `/city/new-york` SSG page
- `/city/tokyo` SSG page
- `/city/sydney` SSG page
- `/api/weather?city=Paris` live JSON endpoint

## Build

```bash
npm run build
npm run start
```
