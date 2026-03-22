# CareerHub LMS (Learn)

Learning Management System for CareerHub.

## Ports
- Default: 3002

## Scripts
- `npm run dev`: Start development server on port 3002 (`next dev -p 3002`)
- `npm run build`: Build for production
- `npm start`: Start production server on port 3002 (`next start -p 3002`)

## Isolation
This app is isolated from the main CareerHub application.
- Authentication: Uses shared `localStorage` for JWT tokens.
- Port: 3002
- Build Output: `standalone` (for Docker readiness)
