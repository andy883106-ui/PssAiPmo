"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setNoticeText } from "@/components/NoticeBar";
import {
  addReport,
  addWorkItem,
  loadJobs,
  loadReports,
  loadWorkItems,
  setJobStatus,
  type JobItem,
} from "@/lib/ops";
import type { Session } from "@/lib/staff";
import { dayKey } from "@/lib/utils";

type StaffSession = Extract<Session, { role: "staff" }>;

type Props = {
  session: StaffSession;
  actingFromAdmin?: boolean;
  onLogout: () => void;
  onBackToAdmin?: () => void;
  onOpenChat: () => void;
};

export function StaffDesk({
  session,
  actingFromAdmin,
  onLogout,
  onBackToAdmin,
  onOpenChat,
}: Props) {
  const [jobs, setJobs] = useState<JobItem[]>(() => loadJobs());
  const [reportText, setReportText] = useState("");
  const [workTitle, setWorkTitle] = useState("");

  const myJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.assignee.includes(session.name) ||
          j.assignee.toLowerCase().includes(session.email.toLowerCase()) ||
          j.assignee === "未指定",
      ),
    [jobs, session.email, session.name],
  );
  const reports = loadReports().filter((r) => r.author === session.name);
  const works = loadWorkItems().filter((w) => w.owner === session.name);

  return (
    <div className="app-shell desk-shell">
      <header className="desk-header">
        <div>
          <p className="app-kicker">
            員工工作台 · V3{actingFromAdmin ? " · 管理者測試中" : ""}
          </p>
          <h1>{session.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-10" onClick={onOpenChat}>
            呼叫小均
          </Button>
          {actingFromAdmin && onBackToAdmin ? (
            <Button type="button" variant="outline" className="h-10" onClick={onBackToAdmin}>
              回總網
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="h-10" onClick={onLogout}>
            登出
          </Button>
        </div>
      </header>

      <div className="desk-layout">
        <section className="desk-card stack-gap">
          <h2>今日交代／派工</h2>
          <ul className="plain-list">
            {myJobs.map((j) => (
              <li key={j.id} className="plain-list-item">
                <div>
                  <strong>{j.title}</strong>
                  <p>{j.detail || "（無說明）"}</p>
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
                    接手
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      setJobStatus(j.id, "done");
                      setJobs(loadJobs());
                      setNoticeText(`已完成：${j.title}`);
                    }}
                  >
                    完成
                  </Button>
                </div>
              </li>
            ))}
            {!myJobs.length ? (
              <li className="muted">目前沒有指派給你的交代。</li>
            ) : null}
          </ul>
        </section>

        <section className="desk-card stack-gap">
          <h2>工作回報</h2>
          <Input
            placeholder={`${dayKey()} 今天做了什麼…`}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              if (!reportText.trim()) return;
              addReport({
                author: session.name,
                day: dayKey(),
                text: reportText.trim(),
              });
              setReportText("");
              setNoticeText("已送出今日回報（本機）。");
            }}
          >
            送出回報
          </Button>
          <ul className="plain-list">
            {reports.slice(0, 5).map((r) => (
              <li key={r.id} className="plain-list-item">
                <strong>{r.day}</strong>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="desk-card stack-gap">
          <h2>預排工作</h2>
          <div className="form-grid">
            <Input
              placeholder="預排事項"
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => {
                if (!workTitle.trim()) return;
                addWorkItem({ title: workTitle.trim(), owner: session.name });
                setWorkTitle("");
              }}
            >
              加入
            </Button>
          </div>
          <ul className="plain-list">
            {works.map((w) => (
              <li key={w.id} className="plain-list-item">
                <strong>{w.title}</strong>
                <span>{w.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
