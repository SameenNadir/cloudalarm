# ☁️ CloudAlarm

> A web app that detects Terraform infrastructure drift and alerts you when your live cloud no longer matches your code.

## What it does
CloudAlarm detects when your live cloud infrastructure no longer matches your Terraform code, a problem called "drift". It runs `terraform plan -detailed-exitcode` on a project folder and alerts you when changes are detected.

## Demo
The hosted version at [cloudalarm.vercel.app](https://cloudalarm.vercel.app) opens a landing page with a link to the dashboard at [/dashboard](https://cloudalarm.vercel.app/dashboard). Scanning needs a Terraform folder on the same machine as the backend, so adding a project only works when you run the app locally (see Setup below).

Next step: accept uploaded Terraform plan files so the hosted version can scan too.

## Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Axios (deployed on Vercel)
- **Backend:** Node.js, Express.js (deployed on Railway)
- **Database and auth:** Supabase (PostgreSQL) with Row Level Security
- **Engine:** Terraform CLI (exit code detection)

## Features
- One-click drift detection
- DRIFT DETECTED / IN SYNC status
- Terraform diff viewer
- Scan history dashboard with stats, search and CSV export
- Multiple projects with a collapsible sidebar
- Email alerts
- Per-user data isolation with Supabase Row Level Security

## Setup (local)
Requires Node.js and the Terraform CLI installed.

1. Clone the repo.
2. Backend: `cd backend`, then `npm install`, then `npm start` (runs on port 4000).
3. Frontend: `cd frontend`, then `npm install`, then `npm run dev`.
4. Add your own Supabase keys to `.env` files (never commit them).
5. In the dashboard, add a project that points at the `test-terraform` folder and click Run Scan.

## Planned
- Uploading Terraform plan files for hosted scanning
- Stripe billing

## Status
In active development.

## License
MIT. See the [LICENSE](LICENSE) file.
