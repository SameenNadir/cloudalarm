# ☁️ CloudAlarm

> B2B SaaS for detecting Terraform infrastructure drift in real-time.

## What it does
CloudAlarm detects when your live cloud infrastructure no longer matches your Terraform code — a problem called "drift". It runs `terraform plan -detailed-exitcode` automatically and alerts you when changes are detected.

## Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Axios
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Engine:** Terraform CLI (exit code detection)
- **Billing:** Stripe (coming soon)

## Features
- 🔍 One-click drift detection
- 🚨 Real-time DRIFT DETECTED / IN SYNC status
- 📊 Scan history dashboard with stats
- 💾 All results saved to cloud database

## Status
🚧 In active development — Phases 1-4 complete