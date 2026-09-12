"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setNoticeText } from "@/components/NoticeBar";
import { callCloud, loadGasSetup, saveGasSetup } from "@/lib/cloud";
import {
  ADMIN_MENU,
  addReport,
  addWorkItem,
  loadAdminPage,
  loadJobs,
  loadReports,
  loadWorkItems,
  saveAdminPage,
  setJobStatus,
  upsertJob,
  type AdminPageId,
  type JobItem,
} from "@/lib/ops";
import { loadStaffSeats, saveActing, type Session } from "@/lib/staff";
import { dayKey, uid } from "@/lib/utils";

type Props = {
  session: Extract<Session, { role: "admin" }>;
  onLogout: () => void;
  onEnterStaffDesk: () => void;
  onRefreshIdentity: () => void;
};

export function AdminHub({
  session,
  onLogout,
  onEnterStaffDesk,
  onRefreshIdentity,
}: Props) {
  const [page, setPage] = useState<AdminPageId>(() => loadAdminPage());
  const [jobs, setJobs] = useState<JobItem[]>(() => loadJobs());
  const [jobTitle, setJobTitle] = useState("");
  const [jobDetail, setJobDetail] = useState("");
  const [jobAssignee, setJobAssignee] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [reportText, setReportText] = useState("");
  const [query, setQuery] = useState("");
  const [gasUrl, setGasUrl] = useState(() => loadGasSetup().url);
  const [gasSecret, setGasSecret] = useState(() => loadGasSetup().secret);
  const [cloudMsg, setCloudMsg] = useState("");
  const seats = useMemo(
    () => loadStaffSeats().filter((s) => s.enabled && s.email),
    [],
  );
  const reports = loadReports();
  const works = loadWorkItems();

  function go(next: AdminPageId) {
    setPage(next);
    saveAdminPage(next);
  }

  async function saveCloud() {
    saveGasSetup({ url: gasUrl.trim(), secret: gasSecret.trim() });
    const ping = await callCloud("ping", {});
    if (ping?.needSetup) {
      setCloudMsg(String(ping.error || "還沒接上雲端。"));
    } else if (ping?.ok === false) {
      setCloudMsg(String(ping.error || "連線失敗。"));
    } else {
      setCloudMsg("已儲存，雲端回應正常或已接受設定。");
      setNoticeText("V3 雲端設定已更新。");
    }
  }

  const filteredJobs = jobs.filter((j) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.detail.toLowerCase().includes(q) ||
      j.assignee.toLowerCase().includes(q)
    );
  });

  return (
    <div className="app-shell desk-shell">
      <header className="desk-header">
        <div>
          <p className="app-kicker">總網 · V3 · {session.email}</p>
          <h1>
            {page === "menu"
              ? "陳小均總網"
              : ADMIN_MENU.find((m) => m.id === page)?.title || "總網"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {page !== "menu" ? (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => go("menu")}
            >
              功能選單
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="h-10" onClick={onLogout}>
            登出
          </Button>
        </div>
      </header>

      {page === "menu" ? (
        <div className="admin-menu-grid">
          {ADMIN_MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className="admin-menu-card"
              onClick={() => {
                if (item.id === "engineer") {
                  onEnterStaffDesk();
                  return;
                }
                go(item.id);
              }}
            >
              <strong>{item.title}</strong>
              <span>{item.desc}</span>
            </button>
          ))}
        </div>
      ) : null}

      {page === "jobs" ? (
        <section className="desk-card stack-gap">
          <h2>交代與預約</h2>
          <div className="form-grid">
            <Input
              placeholder="事項標題"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <Input
              placeholder="指派給誰"
              value={jobAssignee}
              onChange={(e) => setJobAssignee(e.target.value)}
            />
            <Input
              placeholder="說明"
              value={jobDetail}
              onChange={(e) => setJobDetail(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => {
                if (!jobTitle.trim()) return;
                upsertJob({
                  title: jobTitle.trim(),
                  detail: jobDetail.trim(),
                  assignee: jobAssignee.trim() || "未指定",
                });
                setJobs(loadJobs());
                setJobTitle("");
                setJobDetail("");
                setJobAssignee("");
                setNoticeText("已新增交代事項。");
              }}
            >
              新增交代
            </Button>
          </div>
          <ul className="plain-list">
            {jobs.map((j) => (
              <li key={j.id} className="plain-list-item">
                <div>
                  <strong>{j.title}</strong>
                  <p>
                    {j.assignee} · {j.status} · {j.detail || "（無說明）"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      setJobStatus(j.id, "doing");
                      setJobs(loadJobs());
                    }}
                  >
                    進行中
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      setJobStatus(j.id, "done");
                      setJobs(loadJobs());
                    }}
                  >
                    完成
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {page === "work" ? (
        <section className="desk-card stack-gap">
          <h2>工作事項</h2>
          <div className="form-grid">
            <Input
              placeholder="工作標題"
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => {
                if (!workTitle.trim()) return;
                addWorkItem({ title: workTitle.trim(), owner: session.name });
                setWorkTitle("");
                setNoticeText("已新增工作事項。");
              }}
            >
              新增
            </Button>
          </div>
          <ul className="plain-list">
            {works.map((w) => (
              <li key={w.id} className="plain-list-item">
                <strong>{w.title}</strong>
                <span>
                  {w.owner} · {w.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {page === "overview" || page === "ask" ? (
        <section className="desk-card stack-gap">
          <h2>{page === "ask" ? "每日詢問／公告" : "回報總覽"}</h2>
          {page === "ask" ? (
            <div className="form-grid">
              <Input
                placeholder="跑馬燈公告"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  if (!reportText.trim()) return;
                  setNoticeText(reportText.trim());
                  addReport({
                    author: session.name,
                    day: dayKey(),
                    text: reportText.trim(),
                  });
                  setReportText("");
                }}
              >
                發布公告
              </Button>
            </div>
          ) : null}
          <ul className="plain-list">
            {reports.map((r) => (
              <li key={r.id} className="plain-list-item">
                <strong>
                  {r.day} · {r.author}
                </strong>
                <p>{r.text}</p>
              </li>
            ))}
            {!reports.length ? <li className="muted">尚無回報／公告。</li> : null}
          </ul>
        </section>
      ) : null}

      {page === "search" ? (
        <section className="desk-card stack-gap">
          <h2>資料庫搜尋（本機）</h2>
          <Input
            placeholder="搜尋交代／工作"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="plain-list">
            {filteredJobs.map((j) => (
              <li key={j.id} className="plain-list-item">
                <strong>{j.title}</strong>
                <span>
                  {j.assignee} · {j.status}
                </span>
              </li>
            ))}
            {!filteredJobs.length ? (
              <li className="muted">沒有符合的資料。</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {page === "progress" ||
      page === "process" ||
      page === "inbox" ||
      page === "files" ||
      page === "learn" ? (
        <section className="desk-card stack-gap">
          <h2>{ADMIN_MENU.find((m) => m.id === page)?.title}</h2>
          <p className="muted">
            V3 已建立此總網模組骨架。接上 GAS 後會顯示雲端資料。目前可先用「交代與預約」「工作事項」「雲端與分享」。
          </p>
          <Button type="button" variant="outline" onClick={() => go("cloud")}>
            前往雲端設定
          </Button>
        </section>
      ) : null}

      {page === "people" ? (
        <section className="desk-card stack-gap">
          <h2>人員與登入</h2>
          <ul className="plain-list">
            {seats.map((s) => (
              <li key={s.id} className="plain-list-item">
                <strong>{s.name}</strong>
                <span>{s.email || "（未設定 Email）"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {page === "identity" ? (
        <section className="desk-card stack-gap">
          <h2>切換身分（測試）</h2>
          <p className="muted">
            管理者可暫時變成訪客或任一員工，方便驗收流程。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                saveActing({
                  role: "visitor",
                  name: "測試訪客",
                  phone: "0912000000",
                  visitorId: uid("act-visitor"),
                });
                setNoticeText("已切換成測試訪客。");
                onRefreshIdentity();
              }}
            >
              變成測試訪客
            </Button>
            {seats.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="outline"
                onClick={() => {
                  saveActing({ role: "staff", email: s.email, name: s.name });
                  setNoticeText(`已切換成 ${s.name}。`);
                  onRefreshIdentity();
                }}
              >
                變成 {s.name}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                saveActing(null);
                setNoticeText("已回到管理者總網。");
                go("menu");
                onRefreshIdentity();
              }}
            >
              回到管理者
            </Button>
          </div>
        </section>
      ) : null}

      {page === "cloud" ? (
        <section className="desk-card stack-gap">
          <h2>雲端與分享</h2>
          <label className="stack-gap">
            <span>Apps Script /exec 網址</span>
            <Input
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </label>
          <label className="stack-gap">
            <span>密鑰</span>
            <Input
              value={gasSecret}
              onChange={(e) => setGasSecret(e.target.value)}
              placeholder="secret"
            />
          </label>
          <Button type="button" onClick={() => void saveCloud()}>
            儲存並測試
          </Button>
          {cloudMsg ? <p className="muted">{cloudMsg}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
