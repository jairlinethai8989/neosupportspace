# 🚀 NEO Support: Project Handover & Resume Note

> **ATTENTION AGENT**: You are taking over a project that has already successfully completed its **initial 12-round MVP development plan**. 
> This project is a **LINE-first Support Portal** (LIFF) with a secondary **Agent Intelligence Dashboard**.

## 📍 Current State: Round 12 COMPLETED
- [x] Database Schema (PostgreSQL/Supabase) created & migration file ready.
- [x] Core Authentication (LINE LIFF for Customers / Supabase Auth for Agents) implemented.
- [x] Customer Flow (Registration -> New Ticket -> Chat Thread) fully functional.
- [x] Agent Flow (Dashboard -> Queue Filtering -> Claim -> Status Change -> Reply) fully functional.
- [x] Hardening & Build Safety (Async Params fix, force-dynamic pages) integrated.

## 🛠 Project Blueprint
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (RLS enabled)
- **UI System**: Tailwind CSS (Modern aesthetics, 3-column layout for agents)
- **Identity**: `src/lib/customer-session.ts` (Customer JWT) + Supabase Auth (Agent)

## 🔑 Critical Setup (Machine Migration Check)
1. **Env Vars**: Make sure `.env.local` is copied or re-created from `.env.example`.
2. **Database**: The schema is in `supabase/migrations/001_init.sql`. Ensure it's executed in the new Supabase instance.
3. **Dependencies**: Run `npm install` after moving.
4. **Build Check**: `npm run build` has been verified to pass on the previous machine.

## ⏭️ Next Recommended Tasks (Phase 2)
1. **Image Uploads**: Implement Supabase Storage for ticket attachments in `src/components/customer/TicketThread.tsx` and `src/components/agent/AgentTicketPanel.tsx`.
2. **LINE Integration**: Link the LIFF pages to a real LINE Rich Menu.
3. **CSAT Flow**: Add a "Rate Response" star component after ticket resolution.
4. **Agent Internal Notes**: Implement a sub-thread for internal collaboration on tickets.

## 💡 Note for the Next Agent
- **Thailand Context**: The UI uses Thai labels and formatting (`th-TH`). Maintain this style.
- **Quota Optimized**: Prioritize self-service LIFF interactions over Push notifications to save LINE Messaging API costs.
- **Architectural Rules**: Stick to standard SSR/CSR patterns defined in `src/lib/supabase-server.ts` and `src/lib/supabase-browser.ts`.

---
**NeoSupport v1.0.0 Ready for Deployment / Enhancement.**
