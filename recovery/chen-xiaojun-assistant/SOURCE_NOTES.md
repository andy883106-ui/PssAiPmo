# Source reconstruction notes (from transcript + live bundle)

## Confirmed original project shape
- Next.js **16.3.4** App Router (`src/app`), React **19.2.8**
- shadcn **base-nova** style, Tailwind v4, lucide icons
- Package name: `chen-xiaojun-assistant`
- Dev/start scripts bind port **43147** on `0.0.0.0`

## API
- Live bundle calls **`/api/xiaojun`** (POST JSON with `action`, optional `url`/`secret`)
- Pasted route body proxies to Google Apps Script `/exec` URL
- Env fallbacks: `XIAOJUN_GAS_URL`, `XIAOJUN_GAS_SECRET`
- Agent previously saved the same body under `src/app/api/gas/route.ts` (likely wrong folder name)

## Frontend symbols (compiled)
- Components: `RoleDesk`, `NoticeBar`, `DeskErrorBoundary`
- localStorage: `pika-work-logs-v1`, `jun-ios-hint`
- CSS class prefixes: `desk-*`, `notice-*`, `pmo-*`
- Public asset: `chen-xiaojun-animated.webp`

## Still missing original TS/TSX
`page.tsx`, `layout.tsx`, `globals.css`, component sources, `src/lib/*`,
`next.config.*`, `postcss.config.*`, and Apps Script backend.

## How to get full source
Vercel → project `andy88310620260906` → Deployments → `ECrYi1D98` → **Source / View code**
(deployed via `vercel deploy` CLI, not GitHub).
