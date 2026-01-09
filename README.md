# Grocery Todo

A Next.js app for managing grocery lists (with optional recipe tracking) backed by Supabase.

## Architecture

- **Next.js (App Router)** for the UI and API routes
- **Supabase** for auth + persistence
- **Recipe Service (microservice)** for recipe URL scraping (see below)

## Recipe Service (microservice)

**Recipe Service** is a small **FastAPI** microservice that extracts structured recipe data (title, ingredients, instructions, etc.) from supported recipe web pages using `recipe-scrapers`.

This app calls it via a Next.js API route:

- The UI sends a recipe URL to `POST /api/recipe-scrape`.
- The server route forwards the request to the Recipe Service at `POST /parse` and returns normalized JSON back to the client.

Deployment notes (Recipe Service):

- The microservice is built into a Docker image from its Dockerfile.
- It is deployed on **Render**, which runs the image as a container.

## Environment variables

Create a `.env.local` file in the project root with the following values:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key (required for the old-list cleanup API)
- `RECIPE_SERVICE_URL` — base URL of the Recipe Service (example: `https://<your-service>.onrender.com`)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## API routes

- `POST /api/recipe-scrape` — proxies recipe parsing to the Recipe Service (`RECIPE_SERVICE_URL` + `/parse`).
- `POST /api/cleanup-old-lists` — calls a Supabase RPC using the service role key to delete old lists (requires an authenticated user).

## Tech notes

- This project is a Next.js app (see Next.js docs: https://nextjs.org/docs).
- Supabase migrations (if you use them) are tracked under `supabase/migrations/`.
