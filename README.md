# Trail Dig Days

A trail building volunteer event management SPA. Browse, create, and join trail work days with interactive maps, calendar views, and customizable profiles.

**Stack:** Vite + React + TypeScript + Redux Toolkit + Leaflet  
**Deployed:** [jacoblbagent.github.io/trail-dig-days](https://jacoblbagent.github.io/trail-dig-days/)

## Features

- **Map view** -- Browse events by location with search radius filtering
- **Calendar view** -- See events on a monthly calendar with day-dot indicators
- **Event management** -- Create, edit, and manage dig day events (organization accounts)
- **Profile system** -- Customizable user profiles with bio, skills, gear, and social links
- **Repeating events** -- Support for recurring work party schedules
- **Auth** -- Sign-up/login with volunteer/organization account types
- **Notifications** -- In-app notification panel with radius-based event filtering
- **Theme** -- Light/dark mode toggle

## Quick Start

```bash
npm install
npm run dev     # starts on port 5174
npm run build   # tsc -b && vite build
```

The app runs entirely client-side -- all state is in Redux with localStorage persistence. Seed data (59+ events, demo user, creator profiles) loads automatically on first visit.

## Demo Login

- **Email:** demo@trailbuilder.com
- **Password:** demo1234
- **Account type:** Organization (can create events)

## Development

**Dev server:** `http://localhost:5174/trail-dig-days/`
**Build:** `npm run build`
**Deploy:** `npx gh-pages -d dist`

Uses BrowserRouter with a 404.html redirect for GitHub Pages compatibility. Vite base `/trail-dig-days/`.
