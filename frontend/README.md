# CrewFlow Frontend

Welcome to the frontend of CrewFlow, an internal company management dashboard. This application provides the user interface for authenticating, managing tasks, viewing analytics, and handling internal communications.

## Prerequisites
- Node.js (v18 or higher recommended)
- The CrewFlow backend API running locally or deployed.

## Installation

```bash
npm install
```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `.next` folder.
- `npm run lint`: Runs the linter to catch syntax and styling issues.

## Environment Variables

Copy `.env.example` to `.env.local` to configure your environment variables. **Do not commit `.env.local` to version control.**

Example configuration:

```env
# The base URL of the CrewFlow backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Google OAuth Client ID for authentication
NEXT_PUBLIC_GOOGLE_CLIENT_ID=example-client-id.apps.googleusercontent.com
```

## Backend API Dependency

This frontend relies heavily on the CrewFlow backend. For local development, ensure the backend is running (typically at `http://localhost:3001`). Configure `NEXT_PUBLIC_API_URL` to point to the backend instance.

## Authentication

CrewFlow uses JWT-based authentication along with Google OAuth. To enable Google Sign-In locally, you must provide a valid `NEXT_PUBLIC_GOOGLE_CLIENT_ID` obtained from the Google Cloud Console.

## Progressive Web App (PWA)

This application includes Progressive Web App (PWA) capabilities. It can be installed on supported devices for a native-like experience. Service workers are utilized to manage caching and offline behavior where applicable.

## Production Deployment

When deploying to production, do not hardcode environment variables into the application source code. Configure the deployment platform (e.g., Vercel, Netlify, Docker) to supply the production environment variables during the build and runtime.

Example Production Env:
`NEXT_PUBLIC_API_URL=https://api.crewflow.example.com/api/v1`

Run `npm run build` to create an optimized production build, followed by `npm start` to run a production server if not using a platform like Vercel.
