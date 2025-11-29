<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lBRQ9TIsaGC-UPdNvruWR9JEBNdkWcUd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.com).
   - Run the SQL in `supabase_setup.sql` in the Supabase SQL Editor.
   - Update `.env.local` with your Supabase URL and Anon Key (already done if you provided them).
3. Run the app:
   `npm run dev`

## Features
- Admin Dashboard (Login: admin@demo.local / demo123)
- News Creation & Layouts
- Public News Portal with Filters (Date, Tags)
