# ⛰️ Trail Dig Days

A web app for trail building volunteers to **find, organize, and sign up** for volunteer dig days. Built with React, TypeScript, Redux, and Leaflet maps.

**[🌐 Live App](https://jacoblbagent.github.io/trail-dig-days)**

---

## Features

### 🗺️ Map-Based Discovery
- Interactive Leaflet map showing all dig day events
- **Radius search** — find events within 5–250 miles of your location
- Geolocation auto-detect with visual search radius overlay
- Click markers for quick event info

### 👤 Customizable Profiles
- Bio, location, trail crew affiliation
- **Skills & certifications** — toggle from 12 trail-building expertise tags
- **Dig stats** — track total dig days, hours, and trail miles
- **Gear list** — show what equipment you bring
- **Custom fields** — add any label/value pair to your profile
- **Profile theme** — accent color picker, header image, layout (standard/compact/hero), toggle visibility of stats/gear/social

### 🛠️ Organizing Dig Days
Create detailed events specifying:
- Trail name, system, location (lat/lng), date/time
- Physical difficulty level
- **Provided by crew** — toggle from 18 common items (shovels, McLeods, water, gloves, PPE, snacks) with quantity and notes
- **Recommended to bring** — toggle from 16 essentials, mark each as ⭐ essential with optional notes
- Requirements (one per line), parking & weather notes
- Volunteer capacity with live progress bar
- Contact info displayed to registrants

### 📋 Event Management
- Sign up / unregister for dig days
- Volunteer count with progress bar
- Event detail page with location map, items grids, and requirements list
- Creators can delete their events

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 18 + TypeScript |
| **State** | Redux Toolkit |
| **Routing** | React Router v6 |
| **Map** | Leaflet + react-leaflet |
| **Build** | Vite |
| **Deploy** | GitHub Pages (via Actions) |

---

## Getting Started

```bash
# Clone
git clone https://github.com/jacoblbagent/trail-dig-days.git
cd trail-dig-days

# Install
npm install

# Dev server
npm run dev        # http://localhost:5173

# Production build
npm run build
npm run preview    # http://localhost:4173
```

---

## Project Structure

```
src/
├── app/
│   ├── store.ts          # Redux store configuration
│   └── hooks.ts          # Typed hooks (useAppDispatch, useAppSelector)
├── types/
│   └── index.ts          # All TypeScript interfaces
├── features/
│   ├── auth/
│   │   ├── authSlice.ts  # Auth state + register/login thunks
│   │   └── AuthPage.tsx  # Login / signup form
│   ├── profile/
│   │   ├── profileSlice.ts  # Profile CRUD + custom fields
│   │   └── ProfilePage.tsx  # Heavily customizable profile editor
│   ├── events/
│   │   ├── eventsSlice.ts  # Events CRUD + volunteer registration
│   │   ├── CreateEventPage.tsx  # Dig day creation form
│   │   └── EventDetailPage.tsx  # Full event view
│   └── map/
│       └── MapPage.tsx    # Split-panel map + event list
├── components/
│   └── Navbar.tsx         # Top navigation bar
├── styles.css             # All styles
├── App.tsx                # Router + app shell
└── main.tsx               # Entry point
```

---

## Data Storage

All data is persisted to **localStorage** — no backend server required:
- `trail-dig-auth` — current user session
- `trail-dig-users` — all registered accounts
- `trail-dig-profiles` — user profiles
- `trail-dig-events` — dig day events

---

## License

MIT