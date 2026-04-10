# GeoSphere

GeoSphere is a geography explorer that combines interactive mapping, location-based news, and world trivia in one polished experience. It is designed to help users discover places through context, movement, and lightweight learning.

## What GeoSphere offers

- A clear product concept instead of isolated API widgets
- Vanilla JavaScript modules for state, services, location, and UI rendering
- Resilient UX with loading states, empty states, and fallbacks
- Local persistence for favorites, search history, session restore, and map state
- A stronger presentation layer with responsive layout and clear place-discovery flows

## Features

- Search for a city, country, or landmark with Mapbox geocoding
- Explore the selected location on an interactive map
- Read place-related headlines from WorldNewsAPI
- Answer general and geography-only trivia questions
- Save favorite places for quick return visits
- Reopen recent searches with one click
- Resume your last session automatically with localStorage

## Stack

- HTML
- CSS
- Vanilla JavaScript modules
- Mapbox GL JS
- WorldNewsAPI
- OpenTriviaDB
- Numbers API

## Running locally

Because the app uses ES modules, it is best opened with a small local server instead of double-clicking the HTML file.

1. Open the project in VS Code.
2. Create `js/config.js` from the `js/config.example.js` template and add your Mapbox public token as `mapboxToken`.
3. Start a local server such as Live Server.
4. Open `index.html`.

For live headlines during local development, run the project with `vercel dev` so the `/api/news` function can read `WORLD_NEWS_API_KEY` from your Vercel environment.

## Vercel deployment

GeoSphere is set up to deploy as a static site with Vercel Functions for configuration and news proxying.

Set these environment variables in Vercel before deploying:

- `MAPBOX_PUBLIC_TOKEN`
- `WORLD_NEWS_API_KEY`

Recommended deployment flow:

1. Import the repository into Vercel or run `vercel` from the project directory.
2. Add the two environment variables in the Vercel project settings.
3. Deploy to preview or production.

## Why GeoSphere works

- GeoSphere is stronger than a typical geography app landing page because the features support one user journey: understand a place quickly through context, content, and interaction.
- The app separates data fetching, persistence, location logic, and UI rendering into small modules, which makes the code easier to maintain and extend.
- The interface includes useful details such as favorites, recent searches, session restore, and fallback content so the experience still feels complete under imperfect network conditions.
