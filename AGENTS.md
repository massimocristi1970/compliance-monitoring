# Agents

## Cursor Cloud specific instructions

This is a Compliance Monitoring Dashboard — a React/Vite/Tailwind single-page app with no custom backend. All backend functionality (auth, data storage) is handled by external SaaS services (Firebase Auth, GitHub API, Microsoft Graph).

### Project layout

- `dashboard/` — Main React app (Vite dev server). This is the primary service.
- `scripts/` — Node.js CLI utilities for data sync/validation (optional, not needed for the dashboard to run).
- `data/` — JSON compliance data files referenced by the dashboard.

### Running the dashboard

```
cd dashboard && npm run dev
```

The Vite dev server starts at `http://localhost:5173/compliance-monitoring/` (note the base path configured in `vite.config.js`).

### Build

```
cd dashboard && npm run build
```

### Key caveats

- **No lint or test commands** are configured in `dashboard/package.json`. The only verification is `npm run build`.
- **No ESLint or Prettier config** exists in the repo.
- The `base` path in `vite.config.js` is `/compliance-monitoring/`, so the dev server URL is `http://localhost:5173/compliance-monitoring/` — not the root.
- Firebase and MSAL credentials are hardcoded in `dashboard/src/firebase.js` and `dashboard/src/msal.js` (no `.env` needed).
- Auth features (GitHub OAuth via Firebase, Microsoft MSAL for OneDrive) require browser popups and external accounts — the dashboard loads and functions in read-only/demo mode without authentication.
