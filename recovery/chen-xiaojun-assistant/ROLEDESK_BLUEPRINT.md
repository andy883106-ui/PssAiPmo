# 陳小均助理 — Reconstruction Blueprint

Source: beautified Next.js client bundle (`app.bundle.beautified.js` ~945KB), live RSC HTML, extracted CSS, zh string dump.  
Live origin clue: `https://andy88310620260906.vercel.app/` · app id `chen-xiaojun-assistant`.  
Goal: enough detail for another agent to implement an approximate TypeScript/React frontend.

---

## 0. Stack & product summary

| Item | Detail |
|------|--------|
| Framework | Next.js App Router (RSC payload in `live-index.html`) |
| Locale | `zh-Hant` |
| Fonts | Noto Sans TC + Geist Mono CSS variables on `<html>` |
| Theme | Soft green “field office” palette (see §6) |
| PWA | `/manifest.webmanifest`, apple-touch-icon, theme-color `#7a9b6d` |
| Title | 陳小均助理 |
| Description | 陳小均總網：訪客詢問與記錄，工程師回覆，管理者用 Gmail 進入並切換身分測試。 |
| Backend proxy | `POST /api/xiaojun` → Google Apps Script (GAS) |
| Character | 「陳小均」= assistant persona for 陳彥均 (owner / admin default) |

**This is effectively a single-page app.** There is no multi-route App Router tree beyond `/`. All “screens” are client-side branches inside `RoleDesk`.

---

## 1. App routes and layout structure

### 1.1 Next.js route tree (from RSC)

```
app/
  layout.tsx          → <html lang="zh-Hant"> + fonts + body.min-h-full
  page.tsx            → DeskErrorBoundary → NoticeBar + RoleDesk
  api/xiaojun/route.ts → proxies { action, ...payload, url, secret } to GAS
  manifest.webmanifest
```

RSC children (from live HTML):

```
DeskErrorBoundary
  NoticeBar          // sticky marquee; null if no notices
  RoleDesk           // entire app UI + gate
```

Loading shell while hydrating:

```html
<div class="app-shell">
  <p class="empty-title">陳小均準備中…</p>
</div>
```

### 1.2 RoleDesk screen state machine (not URL routes)

`RoleDesk` decides what to render from:

1. `session` ← `localStorage["jun-session-v1"]` (`{ role, email, name }` or null)
2. `acting` ← `localStorage["jun-acting-v1"]` (admin impersonation)
3. Gate mode `y`: `"choose" | "visitor" | "engineer" | "chat" | null`

**Effective view identity** `C`:

```ts
C = (session?.role === "admin" && acting)
  ? acting
  : session
    ? { role: session.role, email: session.email, name: session.name }
    : { role: "visitor", email: "", name: "訪客" };
```

**Render branches:**

| Condition | Component | Shell class |
|-----------|-----------|-------------|
| SSR / not ready | empty “陳小均準備中…” | `app-shell` |
| `!session` && gate=`visitor` | Visitor name/phone form (`eA`) | `app-shell` > `login-card` |
| `!session` && gate=`engineer` | Staff email login (`eE`) | `app-shell` > `login-card` |
| `!session` && gate≠`chat` | Identity choose (`eU`) | `app-shell` > `login-card` |
| `C.role === "admin"` | Admin hub (`o6`) | `app-shell desk-shell` |
| `C.role === "staff"` | Staff desk (`rI`) | `app-shell desk-shell` |
| else (visitor / acting visitor) | Chat desk (`oY`) | `app-shell chat-shell` |

Admin “我的日曆與被預約” sets `acting` to staff view of admin’s own seat, then renders staff desk with `showBack`.

### 1.3 Admin hub pages (client page id in `jun-admin-page-v1`)

Menu items (`o0`):

| id | Title | Description |
|----|-------|-------------|
| `engineer` | 我的日曆與被預約 | Jump into staff desk for self (via `onAct`) |
| `progress` | 專案進度 | PMO overdue / missing reports |
| `process` | 專案統一流程 | 12-gate project flow + Drive folder |
| `search` | 資料庫搜尋 | Projects, works, equipment, training |
| `overview` | 回報總覽 | Jun speech + staff replies summary |
| `inbox` | 對話回覆 | Per-visitor threads, reply on top |
| `ask` | 每日詢問 | Check-ins, marquee notices, auto-@assign |
| `jobs` | 交代與預約 | Job list decide/finish/reply |
| `work` | 工作事項 | Unified work-item list |
| `files` | 工作附件／教材 | Uploaded attachments |
| `learn` | 學習與問題庫 | Question bank + knowledge replies |
| `people` | 人員與登入 | Staff seats / Gmail allowlist |
| `identity` | 切換身分 | Act as visitor or any staff |
| `cloud` | 雲端與分享 | GAS URL/secret, QR, Drive links |
| `menu` | 功能選項 | Default menu grid |

---

## 2. Identity / role model

### 2.1 Roles

| role | Chinese UI | How entered | Capabilities |
|------|------------|-------------|--------------|
| `visitor` | 訪客 | Gate “我是訪客” + name/phone | Chat with 陳小均, assign/book jobs, work logs |
| `staff` | 員工 / 工程師 | Gate “我是員工” + allowlisted Gmail | Personal desk: report, calendar, jobs, inbox |
| `admin` | 管理者 / 總網 | Gmail equals admin email | Full admin hub + identity switch + transfer admin |
| (acting) | 測試訪客 / 變成某人 | Admin → 切換身分 | Same UI as visitor/staff but session stays admin |

Session object:

```ts
type Session = {
  role: "visitor" | "staff" | "admin";
  email: string;   // empty for visitor
  name: string;    // "訪客" | seat name | 陳彥均
};
```

Visitor profile (separate):

```ts
type VisitorProfile = {
  id: string;      // = jun-visitor-id-v1 UUID
  name: string;    // ≥ 2 chars
  phone: string;   // digits, length 8–13 after strip
};
```

### 2.2 Built-in staff seats (`jun-staff-seats-v1`)

Default array:

```ts
[
  { id: "huang",   name: "黃侯諴", email: "assam001@gmail.com",      enabled: true },
  { id: "chen",    name: "陳彥均", email: "andy883106@gmail.com",    enabled: true },
  { id: "jian",    name: "簡宏義", email: "jeff0936216950@gmail.com", enabled: true },
  { id: "zhang",   name: "張亭媛", email: "yuan77718@gmail.com",     enabled: true },
  { id: "youshan", name: "張友山", email: "a0922158016@gmail.com",   enabled: true },
  { id: "lin",     name: "林佑安", email: "jerry122924@gmail.com",   enabled: true },
  { id: "pm",      name: "未來PM", email: "",                        enabled: false },
]
```

- Admin email default: `andy883106@gmail.com` (`jun-admin-email-v1`), transferable.
- Login emails history: `jun-login-emails-v1` string[] (max 8).
- Owner display name constant: `陳彥均`.
- Thursday signers (PMO missing-report check): `["簡宏義","黃侯諴","陳彥均","張亭媛"]`.

### 2.3 Login rules

1. Email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (lowercased).
2. If email === admin email → `{ role: "admin", name: 陳彥均-seat }`.
3. Else if email matches built-in seat → `{ role: "staff", name: seat.name }`.
4. Else if email matches enabled custom seat → staff.
5. Else error: `這個信箱不在登入名單…`

Visitor validation:

- Name ≥ 2 characters.
- Phone digits length 8–13.
- Errors: `請填真實姓名，至少兩個字。` / `請填聯絡電話，例如 0912345678。`

---

## 3. State shape for work logs (`pika-work-logs-v1` / `jun-work-logs-v1`)

### 3.1 Keys

| Key | Role |
|-----|------|
| **`jun-work-logs-v1`** | Current primary key (write target) |
| **`pika-work-logs-v1`** | Legacy fallback read only |

Loader:

```ts
const raw =
  localStorage.getItem("jun-work-logs-v1") ??
  localStorage.getItem("pika-work-logs-v1");
```

Writes always go to `jun-work-logs-v1`.

### 3.2 Schema

```ts
type WorkLog = {
  id: string;          // crypto.randomUUID()
  title: string;       // required, trimmed
  content: string;     // required (may be "")
  tags: string[];      // unique trimmed non-empty
  createdAt: string;   // ISO
  updatedAt?: string;  // ISO on update
};

// Storage value: WorkLog[]
// Validated with oB(); sorted newest-first by createdAt
```

Import format also accepts `{ logs: WorkLog[] }`.

### 3.3 API surface (hook inside visitor chat)

```ts
{
  logs: WorkLog[];
  ready: boolean;
  stats: { today: number; week: number; month: number; all: number };
  addLog(input: { title; content?; tags? }): WorkLog;
  updateLog(id, patch): void;
  removeLog(id): void;
  removeLast(): WorkLog | undefined;
  mergeImported(jsonText): number;
  search(query, range: "today"|"week"|"month"|"all", tags[]): WorkLog[];
}
```

Export filename: `xiaojun-work-logs-YYYY-MM-DD.json`.

---

## 4. `callCloud` API actions

### 4.1 Client transport

```ts
async function callCloud(action: string, payload = {}, cfg = loadCloudConfig()) {
  const body = { action, ...payload, url: cfg.url, secret: cfg.secret };
  const res = await fetch("/api/xiaojun", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json(); // typically { ok, error?, needSetup?, sheetUrl?, ... }
}
```

Default GAS config (`jun-cloud-v1`):

```ts
{
  url: "https://script.google.com/macros/s/AKfycbzXZcqs0vLPnm-qw3kfAjGRe3w1n79cUSEFO6mJfj3gLQDeJWOcC_lu7EQwGdVxGnQ/exec",
  secret: "xj-pmo-9k4w2n7h"
}
```

Unknown action detection: error string matches `/未知的動作/`.

### 4.2 Action catalog (complete list found in bundle)

| Action | Payload (key fields) | Response fields used |
|--------|----------------------|----------------------|
| `ping` | (optional config override) | `ok`, `sheetUrl` |
| `listLogs` | — | `ok`, `threads`, `sheetUrl` |
| `appendLog` | `{ messages: CloudMessage[] }` | `ok`, `sheetUrl` |
| `listKnowledge` | — | `ok`, `items`, `sheetUrl` |
| `upsertKnowledge` | `{ item: { id?, keyword, answer, enabled } }` | `ok`, `item` |
| `deleteKnowledge` | `{ id }` | `ok` |
| `listSeats` | — | `ok`, `seats` |
| `saveSeats` | `{ seats }` | `ok` |
| `listJobs` | — | `ok`, `jobs` |
| `syncJobs` | `{ job }` | `ok` |
| `listWorkItems` | — | `ok`, `items` |
| `syncWorkItems` | `{ item }` | `ok` |
| `listReports` | — | `ok`, `reports` |
| `syncReports` | `{ report }` | `ok` |
| `listNotices` | — | `ok`, `notices`, `assigns`, `fired` |
| `saveNotices` | `{ notices, assigns, fired }` | `ok` |
| `uploadAttachment` | `{ filename, mimeType, dataUrl, workId?, jobId?, projectId?, projectName?, title?, author?, purpose?, destFolder?, projectFolderUrl? }` | `ok`, `item` |
| `listAttachments` | — | `ok`, `items` |
| `pmoDump` | — | `ok`, `projects`, `works`, `reports`, `people`, … |
| `pmoSaveProject` | project fields | `ok`, `id`, `folderUrl`, `folderError?` |
| `pmoSaveReport` | report + `id` | `ok` |
| `pmoSaveWork` | work item | `ok` |
| `pmoCompleteWork` | `{ id, completion, attachmentUrl? }` | `ok` |

Related wrapper names (not separate HTTP actions): `pullSeatsFromCloud`, `pushSeatsToCloud`, `syncMessagesToCloud` → `appendLog`, `pullPmo` → `pmoDump`.

### 4.3 Cloud message shape (`appendLog`)

```ts
type CloudMessage = {
  id: string;
  visitorId: string;
  label: string;
  role: "visitor" | "jun" | "staff" | "admin";
  author: string;
  text: string;
  createdAt: string;
};
```

---

## 5. Main component trees

### 5.1 `NoticeBar`

```
NoticeBar
  div.notice-bar[role=status]
    span.notice-label          "公告"
    div.notice-viewport
      p.notice-track[style=animationDuration]
        span {text}
        span[aria-hidden] {text}   // duplicate for marquee loop
    button.notice-speak
      Volume2 icon
      "唸" | "停"
```

- Subscribes via `subscribeNotices` / `enabledNoticeText`.
- Text = enabled notices joined with `"　　"`.
- Duration ≈ `max(14, round(length/3))` seconds.
- Speaks via `speakZh` / `stopSpeak`.
- Returns `null` if empty.
- CSS sets `body:has(.notice-bar){ --notice-h: 2.2rem }`.

### 5.2 `RoleDesk` (root)

```
RoleDesk
  useEffect visualViewport → --kb-gap, --vv-height, --vv-offset, .kb-open
  hydrate: seats, session, acting, inbox, knowledge, visitor profile, jobs
  poll every 12s: ensureDueCheckins, ensureDueAutoAssigns, sync inbox
  pull cloud: ping, listLogs, listKnowledge, jobs, reports, workItems, seats, notices, attachments

  ├─ (loading) empty-title
  ├─ Gate: IdentityChoose | VisitorForm | StaffLogin
  ├─ AdminHub (o6)
  ├─ StaffDesk (rI)
  └─ VisitorChat (oY)
```

### 5.3 Visitor chat (`oY`) — `app-shell chat-shell`

```
VisitorChat
  OnboardingGuide (rD)            // first-run overlay if !jun-onboarded-v1
  header.app-header
    kicker + h1「陳小均助理」
    actions: 看一次範例 | 呼叫小均 | role badge | 更換身分 | 員工登入 | 回總網 | 登出
    header-stats: 今天 / 本週 / 全部 (work-log counts)
  JunBuddy (tI)                   // floating character
  div.mobile-companion            // last jun speech + speak controls
  optional div.ios-hint
  div.desktop-grid
    aside.companion-panel
      button.jun-home → character
      voice controls
      QuickActions (rT)           // 交代/預約/回報/專案/進度…
      div.speech-bubble
    section.main-panel
      details.chat-guide-mobile
      Tabs (聊天 | 紀錄)
        chat:
          message-pane > message-scroll > message-list
            article.bubble.bubble-user | .bubble-jun
          composer (textarea + mic + attach + send)
          action chips / job sheet modal
        logs:
          search / filter / list WorkLog cards
          export / import
```

Chat bubble message (UI state, not inbox):

```ts
type ChatBubble = {
  id: string;
  role: "user" | "jun";   // mapped from visitor/jun
  text: string;
  createdAt: string;
  logIds?: string[];
  files?: { name: string; url?: string }[];
};
```

Intro copy:

- Default: `嗨，我是陳小均，彥均的助手分身。點我或按「呼叫小均」…`
- With visitor name: `{name}，把現場狀況、照片或檔案丟給我…`
- Admin testing: `你是管理者正在測試訪客…`

Quick action ids used in chat: `assign`, `book`, `report`, `project`, `progress`, `install`, `help`, `follow`, `dispatch`, `self-plan`.

### 5.4 Staff desk (`rI`) — `app-shell desk-shell`

```
StaffDesk
  JunBuddy
  header.app-header
    kicker: 「員工 · {name}」 or 「員工／管理 · {name}」
    h1: 個人管理訊息
    actions: 看一次範例 | 呼叫小均 | 登出/功能選項
  div.desk-layout
    aside.desk-rail
      optional section.desk-card.jun-ask   // “陳小均正在問你”
      TodayBoard (tC)                     // waiting / extracts / jobs
      PmoTodoRail (tS)                    // 主資料庫待辦
      WorkItemsPanel (tP)
    div.desk-main
      section#work-message.desk-card.report-box
        h2 工作訊息
        how-steps + quick chips + composer
      section#work-report.desk-card.report-box
        h2 工作事項回報
        date + 「帶入今天格式」 + template textarea
        圖面/教材 chips + file picker + 送出回報
        optional 專案／待辦／後續
      AttachmentsPreview
      section.desk-card
        h2 預排我的工作
        chips 預排時段 / 預排事項
      JobsPanel (e6) 「交代、預約與派工」
      DayDigest (tw) 「當日回報彙總」
      Calendar section (month grid cal-cell / cal-today / cal-on)
```

### 5.5 Admin hub (`o6`) — `app-shell desk-shell`

```
AdminHub
  header: 「總網 · {email}」 + page title + 功能選項/登出
  admin-menu grid OR page body:
    progress | process | search | overview | inbox | ask | jobs | work
    | files | learn | people | identity | cloud
```

`ask` page embeds:

1. 跑馬燈公告 editor  
2. 定時自動交代 editor  
3. Daily check-in / report overview widgets  

---

## 6. Key CSS classes and layout

### 6.1 Design tokens (`:root`)

```css
--background: #f2f7ed;
--foreground: #263223;
--card: #fcfff9;
--primary: #7ea576;
--primary-foreground: #f9fdf6;
--secondary: #e7eee0;
--muted: #ebf1e6;
--muted-foreground: #5a6857;
--accent: #e1ecd8;
--destructive: #d73431;
--border / --input: #cdddca;
--ring: #7ea576;
--radius: .85rem;
--sidebar: #fcf9ea; /* warm cream — used for sidebar tokens, main UI is green */
--notice-h: 0px; /* becomes 2.2rem when notice-bar present */
--vv-height: 100dvh;
--kb-gap: 0px;
```

Theme color / brand green in HTML: `#7a9b6d`.

### 6.2 Layout classes

| Class | Role |
|-------|------|
| `app-shell` | Page container |
| `desk-shell` | Staff/admin padding (safe-area aware) |
| `chat-shell` | Visitor chat shell |
| `login-card` | Gate card |
| `app-header` / `app-kicker` / `header-actions` / `header-stats` | Top bar |
| `desk-layout` | CSS grid; mobile 1-col, desktop `minmax(17.5rem,22rem) 1fr` |
| `desk-rail` | Sticky left column, `max-height: calc(100dvh - 1.4rem)` |
| `desk-main` | Main column |
| `desk-card` / `thread-card` | Cream cards `#fffdf8`, radius 1.15rem |
| `desk-head` / `desk-actions` / `desk-kicker` | Card headers |
| `report-box` / `template-area` | Work report editor (min-height 18rem) |
| `desktop-grid` / `companion-panel` / `main-panel` | Visitor chat two-column |
| `message-pane` / `message-scroll` / `message-list` | Chat scroll |
| `bubble` / `bubble-user` / `bubble-jun` / `bubble-on` | Chat bubbles |
| `notice-bar` / `notice-label` / `notice-viewport` / `notice-track` / `notice-speak` | Marquee |
| `jun-buddy` / `jun-buddy-walk` / `jun-buddy-dock` / `jun-home` / `jun-stage` / `jun-photo` | Character |
| `chip` / `chip-accent` / `quick-row` | Action chips |
| `admin-menu` / `admin-menu-item` | Admin menu |
| `cal-cell` / `cal-out` / `cal-on` / `cal-today` / `cal-head` / `cal-legend` | Calendar |
| `pmo-list` / `pmo-overdue` / `pmo-complete` / `pmo-links` | PMO widgets |
| `guide-body` / `guide-actions` / `how-steps` / `login-error` | Copy helpers |
| `seat-row` / `seat-list` / `seat-name` | People editors |
| `composer-row` / `chat-composer-row` / `composer-extras` | Inputs |

Keyboard: `html.kb-open` hides `.notice-bar` and `.jun-buddy`.  
Body locks: `chat-lock`, `job-sheet-open`.

---

## 7. Landing gate UI copy and fields

### Screen A — 請先確認身分

- Kicker: `陳小均`
- H1: `請先確認身分`
- Body: `訪客進入陳小均對話，交代、預約、查專案。員工用 Email 登入，直接進入自己的待辦、回報與訊息。`
- Buttons: `我是訪客` | `我是員工`

### Screen B — 訪客姓名與電話

- Kicker: `訪客`
- H1: `姓名與聯絡電話`
- Body: `工程師回覆時要找得到你。這台手機會記住，下次不用重填。`
- Fields:
  - 姓名 — placeholder `例如：王小明`
  - 聯絡電話 — tel, placeholder `0912345678`
- Buttons: `返回` | `進入陳小均`

### Screen C — 員工登入

- Kicker: `員工`
- H1: `員工登入`
- Body: `請輸入已登記的 Gmail。黃侯諴、陳彥均、簡宏義、張亭媛、張友山、林佑安換手機也能登入。`
- Field: 登入 Email — placeholder `name@gmail.com`, datalist `jun-login-emails`
- Buttons: `返回` | `進入個人管理`

### Post-login entry points

| Role | Landing |
|------|---------|
| visitor | Chat shell 「把事情告訴我就好」 |
| staff | Desk 「個人管理訊息」 |
| admin | Hub 「功能選項」 with kicker 「總網 · {email}」 |

---

## 8. Other localStorage keys (full inventory)

| Key | Value |
|-----|-------|
| `jun-session-v1` | `Session` |
| `jun-acting-v1` | `Session` impersonation |
| `jun-staff-seats-v1` | `Seat[]` |
| `jun-admin-email-v1` | string email |
| `jun-login-emails-v1` | `string[]` |
| `jun-visitor-id-v1` | UUID |
| `jun-visitor-profile-v1` | `{ id, name, phone }` |
| `jun-onboarded-v1` | `"1"` |
| `jun-ios-hint` | `"1"` |
| `jun-admin-page-v1` | `"menu"` \| page id |
| `jun-work-logs-v1` / `pika-work-logs-v1` | `WorkLog[]` |
| `jun-inbox-v1` | `InboxThread[]` |
| `jun-cloud-v1` | `{ url, secret }` |
| `jun-knowledge-v1` | `KnowledgeItem[]` |
| `jun-question-bank-v1` | `QuestionBankItem[]` |
| `jun-jobs-v1` | `Job[]` |
| `jun-work-items-v1` | `WorkItem[]` |
| `jun-staff-reports-v1` | `StaffReport[]` |
| `jun-work-files-v1` | `WorkFile[]` |
| `jun-notices-v1` | `{ notices, assigns, fired }` |
| `jun-project-flows-v1` | `ProjectFlow[]` |
| `jun-people-memory-v1` | `string[]` remembered names |
| `jun-work-extracts-v1` | extracted follow-ups |
| PMO cache key (module-internal) | projects/works/reports/people snapshot |

---

## 9. Extracted JSON structures

### 9.1 Inbox / messages

```ts
type InboxThread = {
  visitorId: string;
  label: string;
  messages: InboxMessage[];
  updatedAt: string; // ISO
};

type InboxMessage = {
  id: string;
  role: "visitor" | "jun" | "staff" | "admin";
  author: string;
  text: string;
  createdAt: string;
  files?: { name: string; url?: string }[];
};
```

Hidden sync threads (filtered from public UI):

| visitorId | prefix in text | Purpose |
|-----------|----------------|---------|
| `job-sync` | `∷JOB∷` + JSON | Job replication |
| `report-sync` | `∷REPORT∷` + JSON | Report replication |
| `workitem-sync` | `∷WORKITEM∷` + JSON | Work-item replication |
| `self-*` / `auto-assign-*` | — | Also treated as hidden |

Export: `{ exportedAt, title: "陳小均對話紀錄", threads }` → `xiaojun-conversations-YYYY-MM-DD.json`.

### 9.2 Jobs (交代 / 預約)

```ts
type Job = {
  id: string;
  kind: "assign" | "book";
  visitorId: string;
  visitorName: string;
  visitorPhone: string;
  assignee: string;          // seat display name
  day: string;               // YYYY-MM-DD (Asia/Taipei)
  start: string;             // "HH:MM" or ""
  end: string;
  title: string;
  note: string;
  projectId: string;
  projectName: string;
  workType: string;
  nextDate: string;
  relatedWorkId: string;
  pmoWorkId: string;
  status: "pending" | "accepted" | "confirmed" | "rejected";
  rejectReason: string;
  workDone: boolean;
  completion: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Status labels: 待回覆 / 已接受 / 已定案 / 已拒絕.  
Kind labels: 交代 / 預約.

Card text example:

```
@簡宏義 交代工作
2026-09-08 09:00–12:00
專案：國泰信義經貿
類型：施工
下次處理：2026-09-10
標題…
備註…
聯絡：王小明 0912345678
```

Conflict: overlapping confirmed jobs for same assignee/day/time → busy reply.

### 9.3 Work items (統一工作事項)

```ts
type WorkItem = {
  id: string;                 // WI-… or WI-J-{jobId} or WI-P-{pmoId}
  title: string;
  detail: string;
  projectId: string;
  projectName: string;
  assignee: string;
  collaborators: string[];
  status: "open" | "in_progress" | "blocked" | "done" | "cancelled";
  priority: "低" | "一般" | "高" | "緊急";
  source: "chat" | "line" | "report" | "admin" | "system";
  sourceRef: string;          // "job:{id}" | "pmo:{id}" | …
  dueDate: string;
  completedAt: string;
  followUp: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deleted: boolean;
};
```

### 9.4 Staff reports

```ts
type StaffReport = {
  id: string;
  author: string;
  email: string;
  day: string;                // YYYY-MM-DD Taipei
  text: string;
  createdAt: string;
  updatedAt: string;
  threadId?: string;
  projectName?: string;
  files?: { name: string; url: string }[];
  linkedItemIds?: string[];
};
```

Daily work report pattern in text:

```
【工作回報 2026-09-08】
09:00-12:00 …
13:30-18:00 …
明天預計：…
```

Also recognizes `【完成工作】` / `【派工完成】` / `【回覆 …】`.

### 9.5 Knowledge + question bank

```ts
type KnowledgeItem = {
  id: string;
  keyword: string;
  answer: string;
  enabled: boolean;
  updatedAt: string;
};

type QuestionBankItem = {
  id: string;           // q-…
  keyword: string;
  sample: string;
  count: number;
  answer: string;
  options: string[];    // chip replies
  ready: boolean;
  updatedAt: string;
};
```

### 9.6 Notices

```ts
type NoticeState = {
  notices: Notice[];
  assigns: AutoAssign[];
  fired: Record<string, string>; // key `${day}:${assignId}` → ISO
};

type Notice = {
  id: string;
  text: string;
  enabled: boolean;
  updatedAt: string;
};

type AutoAssign = {
  id: string;
  hour: number;          // 0–23
  minute: number;        // 0–59
  assignee: string;
  title: string;
  note: string;
  enabled: boolean;
  repeat: "daily" | "weekdays";
  updatedAt: string;
};
```

### 9.7 Work files

```ts
type WorkFile = {
  id: string;
  workId?: string;
  jobId?: string;
  projectId?: string;
  projectName?: string;
  title?: string;
  author?: string;
  name: string;
  mime: string;
  url: string;             // Drive URL or data: (local)
  size: number;
  purpose: "工作紀錄" | "教育訓練" | "圖面";
  flowTitle: string;
  createdAt: string;
};
```

Limits: images/PDF ~6MB, video ~25MB; images compressed client-side.

### 9.8 Project unified flow (12 gates)

Stored per project in `jun-project-flows-v1`:

```ts
type FlowNode = {
  id: string;
  order: number;
  title: string;
  detail: string;
  followUp: string;
  material: string;
};

type ProjectFlow = {
  projectId: string;
  projectName: string;
  currentId: string;
  nodes: FlowNode[];       // default 12 stages below
  updatedAt: string;
};
```

Default stage titles:

1. 客戶專案需求  
2. 會勘  
3. 圖面  
4. 公司簽呈報價  
5. 備料  
6. 外包水電進場  
7. 施工預約與進場施作  
8. 施工部門設定  
9. 設備系統建置與測試  
10. 驗收  
11. 教育訓練  
12. 交接／維運  

### 9.9 PMO snapshot (embedded equipment/training JSON)

Bundle embeds a large static catalog:

```ts
{
  equipment: Array<{ name, model, type, project }>,
  training: Array<{ id, kind, title, note, url }>
}
```

Plus live PMO dump shape:

```ts
{
  projects: Array<{ id, name, client, system, owner, status, folderUrl? }>,
  works: Array<{ id, title, projectId, status, /* … */ }>,
  reports: Array<…>,
  people: Array<{ name, email?, phone? }>,
  live: boolean,
  source: "snapshot" | "cloud",
  exportedAt?: string
}
```

Active work statuses: `["事項","目前處理"]`.  
Tracked project statuses include: 進行中, 施作中, 修繕中, 已下單, 已成案，待下單, 待議價, 待驗收, 待請款, 待追蹤, 待確認, 啟用.

Fallback project: `{ id: "P_MISC", name: "一般管理", status: "一般管理", … }`.

### 9.10 External URLs (hardcoded)

| Constant | URL |
|----------|-----|
| `XIAOJUN_GAS_URL` | Apps Script exec (see §4.2) |
| `XIAOJUN_DRIVE_URL` | Drive folder for 陳小均 |
| `PMO_SHEET_URL` | Spreadsheet (AI-PMO / training) |
| `PMO_PROGRESS_SHEET_URL` | Progress sheet |
| `PMO_DRIVE_URL` | PMO Drive folder |
| `PMO_EXEC_URL` | Separate PMO Apps Script |
| QR | `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={siteUrl}` |

---

## 10. Implementation plan for a working approximate frontend

### 10.1 Suggested React package layout

```
src/
  app/layout.tsx
  app/page.tsx                 // NoticeBar + RoleDesk
  app/api/xiaojun/route.ts     // proxy to GAS
  components/
    NoticeBar.tsx
    RoleDesk.tsx
    gate/{IdentityChoose,VisitorForm,StaffLogin}.tsx
    chat/VisitorChat.tsx
    desk/StaffDesk.tsx
    admin/AdminHub.tsx
    jun/{JunBuddy,JunFace,SpeakButton}.tsx
    jobs/{JobSheet,JobsPanel}.tsx
    work/{WorkItemsPanel,WorkReportEditor}.tsx
  lib/
    storage.ts                 // typed localStorage helpers
    cloud.ts                   // callCloud + actions
    inbox.ts / jobs.ts / workItems.ts / reports.ts / notices.ts / knowledge.ts / workLogs.ts
    seats.ts / pmo.ts / flows.ts
  styles/globals.css           // tokens + desk/chat/notice classes
  data/equipment-training.json // optional snapshot
```

### 10.2 Minimal MVP path (priority order)

1. **Gate + roles + seats** — choose / visitor form / staff login / session persistence.  
2. **Visitor chat shell** — bubbles, composer, work-log store (`jun-work-logs-v1` with `pika` fallback), quick actions stubs.  
3. **Inbox + callCloud ping/listLogs/appendLog** — sync visitor/jun speech.  
4. **Jobs** — assign/book sheet, local `jun-jobs-v1`, accept/confirm/reject on staff desk.  
5. **Staff desk layout** — `desk-layout` / rail / work message / work report template.  
6. **NoticeBar + notices CRUD**.  
7. **Admin menu shell** — identity switch, people seats, cloud config form.  
8. **Work items + reports + knowledge** — deepen fidelity.  
9. **PMO / flows / attachments** — last (depends on GAS).

### 10.3 Day / timezone rule

All `day` keys use `Asia/Taipei` via:

```ts
new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(date); // → YYYY-MM-DD
```

### 10.4 Polling / sync cadence

- RoleDesk interval: **12 seconds** — due check-ins, auto-assigns, inbox signature diff → cloud append.  
- Cloud hydrate on mount: parallel list* + seats + notices + attachments.

### 10.5 Important UI strings (visitor / staff)

| Context | Copy |
|---------|------|
| Loading | 陳小均準備中… |
| Call CTA | 呼叫小均 |
| Example CTA | 看一次範例 |
| Back to admin | 回總網 |
| Switch identity | 更換身分 |
| Staff login quiet | 員工登入 |
| iOS hint | 要把小均放到 iPhone：用 Safari 打開這個網頁 → 底部分享 → 加入主畫面。 |
| Report template hint | 09:00-12:00 / 13:30-18:00 / 明天預計 |
| Confirm chips | 正確 / 再改 |

### 10.6 Character / motion notes

- Animated asset: `chen-xiaojun-animated.webp`
- Moods: `idle` | `listening` | `happy` | `sad`
- States: floating buddy, docked while guided Q&A, walk animation class `jun-buddy-walk`
- TTS: Chinese speech synthesis for notices and jun replies; autoSpeak preference

---

## 11. Fidelity caveats for the implementing agent

1. Bundle is **minified-then-beautified**; names like `oY`, `rI`, `o6` are compile artifacts — rename freely.  
2. Large NLP / intent router for visitor chat (regex categories: 會勘, 施工, 請款, 教材…) exists; approximate with keyword → knowledge match + job/log intents.  
3. Embedded equipment/training JSON is huge; ship as static data file, do not hardcode in components.  
4. Admin Gmail and seat emails are in the client bundle already; treat as demo defaults, allow override via seats/cloud.  
5. Exact GAS server schema is not in this frontend dump — implement client contracts from §4/§9 and tolerate `未知的動作` / `needSetup`.  
6. Primary work-log key is **`jun-work-logs-v1`**; keep reading **`pika-work-logs-v1`** for migration.

---

## 12. Quick reference: RoleDesk decision tree

```
ready?
  no → 「陳小均準備中…」
  yes → session?
        no → gateMode
              choose    → IdentityChoose
              visitor   → VisitorForm → sets profile + chat
              engineer  → StaffLogin → sets session
              chat      → VisitorChat (anonymous visitor id)
        yes → effectiveRole(session, acting)
              admin  → AdminHub
              staff  → StaffDesk
              visitor→ VisitorChat
```

This blueprint is sufficient to rebuild a functional approximate frontend: gates, role views, local persistence, cloud action stubs, and the desk/chat/notice layouts matching the recovered CSS and copy.
