<<<<<<< HEAD
# STI-Edumarket
STI SJDM Edumarket - for Entrepreneurial Mind
=======
# EduMarket

EduMarket is a React marketplace for STI students.

## Deployment stack

- Frontend: Vercel
- Database/Auth/Storage: Supabase

## Vercel setup

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Use the default Vite build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add any environment variables later if you connect Supabase.

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL editor.
3. Paste and run `supabase/schema.sql`.
4. Turn on Supabase Auth if you want real signup/login.
5. Add storage buckets for listing images if needed.

## SPA routing

This project includes `vercel.json` so direct route refreshes like `/login` and `/profile` work on Vercel.

## Local run

```bash
npm install
npm run dev
```
>>>>>>> f98617e (Edumarket commit)
