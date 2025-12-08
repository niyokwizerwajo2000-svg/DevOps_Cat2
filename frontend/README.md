# Frontend — Ticket Booking

This is a minimal Vite + React frontend for the Ticket Booking Backend.

## Quick start

Install dependencies and start dev server:

```bash
cd frontend
npm install
npm run dev
```

By default Vite runs on `http://localhost:5173`. The frontend expects the backend API at `http://localhost:3000`.

If your backend is on a different host/port, set `VITE_API_URL` when starting Vite:

```bash
VITE_API_URL=http://localhost:3000 npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Notes
- The UI provides listing, booking and deleting tickets.
- The frontend uses `axios` and reads `VITE_API_URL` for the API base URL.
