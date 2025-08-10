# Falcon-MVP Architecture
_Last updated: Aug 10, 2025 (ET)_

## 1) Data Model (schema: `falcon_mvp`)
- **organizations(id, name, created_at)**
- **users(id, organization_id, full_name, role, environment, created_at)**
- **clients(id, organization_id, display_name, kind, notes, environment, created_by, created_at)**
- **orders(id, organization_id, client_id, assigned_to, status: order_status, address, city, state, postal_code, due_date, environment, created_by, created_at)**
- **order_activity(id bigserial, order_id, event_type, event_data jsonb, environment, actor, occurred_at)**

### Enums
- `order_status`: `new | in_review | completed | cancelled`

## 2) Security
- **RLS enabled** on all tables
- Policies restrict by `environment='mvp'` and by org membership via `users.organization_id`
- Optional claim check `(auth.jwt()->>'app')='falcon_mvp'` (disabled by default)
- Writes via **RPCs**; triggers generate system events
- Views (`v_orders`, `v_order_activity`) for read convenience under RLS

## 3) Triggers & Activity
- `orders_after_insert` → `order_created`
- `orders_after_update` → `assigned_to_appraiser` & `status_changed`
- Activity is append-only; user notes allowed via RPC; system events restricted (policy uses `pg_trigger_depth()`)

## 4) RPCs (server-side API)
- `assert_org_membership(p_org uuid)` — guard
- `create_order(...) → uuid`
- `assign_order(order_id, user_id) → uuid`
- `set_order_status(order_id, status order_status) → uuid`
- `add_order_note(order_id, note text) → bigint`
- *(Planned)* `create_client(...) → uuid`, `set_appointment(...) → uuid`, `archive_*`, `search_orders(q)`

## 5) Views
- `v_orders`: joins client/assignee to order
- `v_order_activity`: human-readable `message` w/ actor & assignee names

## 6) Realtime
- Publication includes `falcon_mvp.order_activity`
- Client subscribes per-order: `filter: order_id=eq.<id>`

## 7) Frontend Structure (suggested)
src/
api/ # supabase RPC wrappers (createOrder, assignOrder, setOrderStatus, addOrderNote, createClient…)
features/
orders/ # OrdersTable, filters, hooks
order-detail/ # Drawer, ActivityTimeline, NoteComposer, MapTab
clients/ # ClientSearchCreate, ClientList
reports/ # KPI cards, Workload table
lib/
supabaseClient.ts # createClient({ db: { schema: 'falcon_mvp' } })
auth.ts # role helpers, route guards

markdown
Copy
Edit


## 8) Environment
- Supabase client configured with `{ db: { schema: 'falcon_mvp' } }`
- Realtime enabled for `order_activity`
- Google Maps key for Map tab (read from env)

## 9) Migrations
- SQL kept idempotent where possible (`if exists`, `do $$ begin … exception when duplicate_object then null; end $$;`)
- Place future SQL in `/supabase/migrations/falcon_mvp/` with dated filenames

## 10) Testing
- Unit: RPC wrappers (mock supabase)
- Integration: live Supabase (service role) for read-only sanity and a disposable test schema
- Smoketest script: create/assign/status/note (rolled back)

## 11) CI/CD
- GitHub Actions: Node 20 → `npm ci`, `lint`, `typecheck`, `build`, tests
- Optional SQL step: sanity queries against staging

## 12) Conventions
- Branches: `feat/*`, `fix/*`, `chore/*`
- Commits: Conventional Commits
- PR template: What/Why/How to test + screenshots/GIFs
- Keep `ROADMAP.md` & this doc current
