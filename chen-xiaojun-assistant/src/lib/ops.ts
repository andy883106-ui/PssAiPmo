import { dayKey, uid } from "@/lib/utils";

const JOBS_KEY = "jun-jobs-v3";
const WORK_ITEMS_KEY = "jun-work-items-v3";
const REPORTS_KEY = "jun-reports-v3";
export const ADMIN_PAGE_KEY = "jun-admin-page-v3";

export type JobItem = {
  id: string;
  title: string;
  detail: string;
  assignee: string;
  status: "open" | "doing" | "done";
  createdAt: string;
  updatedAt: string;
};

export type WorkItem = {
  id: string;
  title: string;
  owner: string;
  due?: string;
  status: "todo" | "doing" | "done";
  createdAt: string;
};

export type ReportItem = {
  id: string;
  author: string;
  day: string;
  text: string;
  createdAt: string;
};

export type AdminPageId =
  | "menu"
  | "engineer"
  | "progress"
  | "process"
  | "search"
  | "overview"
  | "inbox"
  | "ask"
  | "jobs"
  | "work"
  | "files"
  | "learn"
  | "people"
  | "identity"
  | "cloud";

export const ADMIN_MENU: { id: AdminPageId; title: string; desc: string }[] = [
  { id: "engineer", title: "我的日曆與被預約", desc: "進入自己的員工工作台" },
  { id: "progress", title: "專案進度", desc: "逾期與缺回報一覽" },
  { id: "process", title: "專案統一流程", desc: "12 關流程與 Drive" },
  { id: "search", title: "資料庫搜尋", desc: "專案／工作／教材" },
  { id: "overview", title: "回報總覽", desc: "小均與員工回覆摘要" },
  { id: "inbox", title: "對話回覆", desc: "訪客對話串回覆" },
  { id: "ask", title: "每日詢問", desc: "公告、定時交代" },
  { id: "jobs", title: "交代與預約", desc: "派工決定／完成／回覆" },
  { id: "work", title: "工作事項", desc: "統一工作事項列表" },
  { id: "files", title: "工作附件／教材", desc: "上傳與附件庫" },
  { id: "learn", title: "學習與問題庫", desc: "知識庫問答" },
  { id: "people", title: "人員與登入", desc: "席位與 Gmail 名單" },
  { id: "identity", title: "切換身分", desc: "以訪客或員工測試" },
  { id: "cloud", title: "雲端與分享", desc: "GAS 網址／密鑰" },
];

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadJobs(): JobItem[] {
  return readList<JobItem>(JOBS_KEY).sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );
}

export function saveJobs(jobs: JobItem[]) {
  writeList(JOBS_KEY, jobs);
}

export function upsertJob(
  input: Omit<JobItem, "id" | "createdAt" | "updatedAt" | "status"> & {
    id?: string;
    status?: JobItem["status"];
  },
) {
  const now = new Date().toISOString();
  const jobs = loadJobs();
  if (input.id) {
    const next = jobs.map((j) =>
      j.id === input.id
        ? {
            ...j,
            title: input.title,
            detail: input.detail,
            assignee: input.assignee,
            status: input.status ?? j.status,
            updatedAt: now,
          }
        : j,
    );
    saveJobs(next);
    return next.find((j) => j.id === input.id)!;
  }
  const created: JobItem = {
    id: uid("job"),
    title: input.title,
    detail: input.detail,
    assignee: input.assignee,
    status: input.status ?? "open",
    createdAt: now,
    updatedAt: now,
  };
  saveJobs([created, ...jobs]);
  return created;
}

export function setJobStatus(id: string, status: JobItem["status"]) {
  saveJobs(
    loadJobs().map((j) =>
      j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j,
    ),
  );
}

export function loadWorkItems(): WorkItem[] {
  return readList<WorkItem>(WORK_ITEMS_KEY);
}

export function addWorkItem(
  input: Omit<WorkItem, "id" | "createdAt" | "status"> & {
    status?: WorkItem["status"];
  },
) {
  const item: WorkItem = {
    id: uid("work"),
    title: input.title,
    owner: input.owner,
    due: input.due,
    status: input.status ?? "todo",
    createdAt: new Date().toISOString(),
  };
  writeList(WORK_ITEMS_KEY, [item, ...loadWorkItems()]);
  return item;
}

export function loadReports(): ReportItem[] {
  return readList<ReportItem>(REPORTS_KEY).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function addReport(input: Omit<ReportItem, "id" | "createdAt">) {
  const item: ReportItem = {
    id: uid("report"),
    author: input.author,
    day: input.day || dayKey(),
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  writeList(REPORTS_KEY, [item, ...loadReports()]);
  return item;
}

export function loadAdminPage(): AdminPageId {
  if (typeof window === "undefined") return "menu";
  return (window.localStorage.getItem(ADMIN_PAGE_KEY) as AdminPageId) || "menu";
}

export function saveAdminPage(page: AdminPageId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_PAGE_KEY, page);
}
