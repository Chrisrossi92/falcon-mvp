# Project Falcon — MVP Roadmap & Agent Plan
_Last updated: Aug 10, 2025 (ET)_

## Mission & Principles
- Prove core workflow: **clients → orders → assignment → status → timeline**.
- Security-first: **RLS everywhere**, **RPC-only writes**, **triggers** for audit.
- Keep scope tight; add milestones as **activity events** (not more enums).
- Small PRs, Conventional Commits, fast iterations, production-ready defaults.

## Roles & Navigation
- Roles: `admin`, `reviewer`, `appraiser`, `staff`
- Sidebar (role-aware): **Orders** (default) • **Clients** • **Reports** • **Settings**

## MVP Screens
- **Orders List**: filters (status, assignee, client, date, search) → row opens **Order Drawer**
- **Order Drawer**: Activity (default), Map tab, Assign dropdown, Status pill, Note composer
- **Clients**: search/create (AMC or lender), client page lists orders
- **Reports (v1)**: KPI cards + workload by appraiser

## Order Lifecycle
- **Statuses (enum):** `new → in_review → completed` (or `cancelled`)
- **Activity events:** `order_created`, `assigned_to_appraiser`, `status_changed`, `user_note`
- Future activity: `appointment_set`, `inspection_done`, `revision_requested`, `delivered`, `due_date_changed`, `file_uploaded`

## Data & Security (current)
- Schema: `falcon_mvp` with **RLS enabled**
- Tables: `organizations`, `users`, `clients`, `orders`, `order_activity`
- Views: `v_orders`, `v_order_activity`
- Triggers: after-insert/after-update → auto activity logs
- Enum: `order_status('new','in_review','completed','cancelled')`
- Guard: `assert_org_membership(p_org uuid)`

## RPC Surface
**Done:**  
- `create_order(org_id, client_id, address, city, state, postal_code, due_date) → uuid`  
- `assign_order(order_id, user_id) → uuid`  
- `set_order_status(order_id, status) → uuid`  
- `add_order_note(order_id, note) → bigint`

**Planned (short-term):**  
- `create_client(org_id, display_name, kind, notes?) → uuid`  
- `set_appointment(order_id, start, end) → uuid` (Phase B)  
- `archive_*` RPCs (orders/clients) (Phase B)  
- `search_orders(q)` (Phase C)

## Realtime
- Channel on `falcon_mvp.order_activity` filtered by `order_id`
- Timeline renders `v_order_activity.message`

## Engineering Conventions
- Branches: `feat/*`, `fix/*`, `chore/*`
- Commits: Conventional Commits `type(scope): summary`
- PR template: What/Why/How to test + screenshots/GIFs
- Keep `CHANGELOG.md` and `docs/architecture.md` updated

## Agent Mode Operating Loop
1. Pull latest; `npm ci`; typecheck; build  
2. DB sanity: RLS on, triggers present, enum consistent  
3. Smoketest RPCs: create/assign/status/note  
4. Diff scan for direct table writes (bypass RPCs)  
5. Open PR(s); update `/.housekeeping/REPORT.md`

## Sprint Plan (Next 2 Weeks)
**Week 1**
- Add `create_client` RPC + `src/api/createClient.ts`
- Orders list filters + wiring to `v_orders`
- Drawer: Note composer + realtime subscription

**Week 2**
- Role-aware sidebar & route guards
- Appointments schema + RPC + UI
- Reports v1 (KPIs + workload)

## Backlog
- Storage uploads + `file_uploaded` activity
- Archive/restore flows (bulk)
- Search RPC + UI
- Email templates/notifications
- Multi-org UX polish

## Definition of Done (MVP)
Create/select client → create order → assign → status change → add note; all visible in timeline with realtime updates; RLS enforced; CI green; basic reports live.
