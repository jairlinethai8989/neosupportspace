# 🏥 NeoSupport (Foundation System)

NeoSupport is a high-performance, **LINE-first** customer support system. It is designed specifically for organizations that use LINE Official Account (OA) as their primary customer entry point, providing a "Zendesk/Jira Service Desk" experience inside LINE via LIFF (LINE Front-end Framework).

## 🏆 Key Features
- **LINE Entry Integration**: Customers enter via LINE Rich Menu and authenticate automatically via LIFF.
- **Quota Efficiency**: Messaging is primarily handled within the LIFF app (Next.js), saving LINE Messaging API push message quotas.
- **Real-time Interaction**: Polling-ready (Real-time WIP) chat thread for immediate customer support.
- **Agent Intelligence**: Dedicated agent dashboard for managing ticket queues, claiming tasks, and tracking SLAs (First Response / Resolution time).
- **Secure by Design**: Built with Supabase RLS (Row Level Security) and Next.js Middleware.

## 🏗 Architecture
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router & Server Components)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Identity Layer**: LINE Login / LIFF (Customer) + Supabase Auth (Agent)
- **Deployment**: Optimized for Vercel or Cloudflare Workers/Pages.

---

## 🛠 Local Setup

### 1. Prerequisites
- Node.js 18+
- A Supabase Project
- A LINE Official Account & LIFF App configured

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and fill in the values:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
NEXT_PUBLIC_LIFF_ID=...
CUSTOMER_SESSION_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
1. Execute the migration in `supabase/migrations/001_init.sql` using the Supabase SQL Editor.
2. (Optional) Run `supabase/seed.sql` to populate sample hospitals and canned replies.

### 4. Run Locally
```bash
npm install
npm run dev
```

---

## 📱 LINE / LIFF Setup
1. **Create LIFF App**: In LINE Developers Console, create a LIFF app under your Provider.
2. **Endpoint URL**: Set the LIFF endpoint to `your-domain.com/liff`.
3. **Scopes**: Ensure `profile` and `openid` are enabled.
4. **Integration**: Link your LIFF ID to `NEXT_PUBLIC_LIFF_ID` in env vars.

---

## 🔒 Security & Compliance
- **No Patient Data**: This system is designed for operational support. Avoid storing HN or patient-sensitive data.
- **Audit Trails**: Every ticket change is logged in `ticket_events` for traceability.
- **Middleware**: Agent routes (`/agent/*`) are protected via Next.js Middleware and Supabase Auth.

## 📅 Version Info
- **Version**: 1.0.0 (MVP Foundation)
- **Target Platform**: Desktop (Agent) & Mobile (Customer via LINE)
