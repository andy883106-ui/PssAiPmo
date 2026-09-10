"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadSession,
  matchStaffByEmail,
  rememberLoginEmail,
  rememberedLoginEmails,
  saveSession,
  type Session,
  VISITOR_ID_KEY,
  VISITOR_PROFILE_KEY,
} from "@/lib/staff";
import { uid } from "@/lib/utils";

type Props = {
  onReady: (session: Session) => void;
};

export function IdentityGate({ onReady }: Props) {
  const [mode, setMode] = useState<"pick" | "visitor" | "staff">("pick");

  if (mode === "visitor") {
    return (
      <VisitorForm
        onBack={() => setMode("pick")}
        onSubmit={(name, phone) => {
          const visitorId =
            window.localStorage.getItem(VISITOR_ID_KEY) || uid("visitor");
          window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
          window.localStorage.setItem(
            VISITOR_PROFILE_KEY,
            JSON.stringify({ name, phone }),
          );
          const session: Session = { role: "visitor", name, phone, visitorId };
          saveSession(session);
          onReady(session);
        }}
      />
    );
  }

  if (mode === "staff") {
    return (
      <StaffForm
        onBack={() => setMode("pick")}
        onSubmit={(email) => {
          const seat = matchStaffByEmail(email);
          if (!seat) return "這組 Email 還沒登記。請用已登記的 Gmail，或請管理者開通。";
          rememberLoginEmail(email);
          const session: Session = {
            role: "staff",
            email: seat.email,
            name: seat.name,
          };
          saveSession(session);
          onReady(session);
          return null;
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="login-card">
        <p className="app-kicker">陳小均</p>
        <h1>請先確認身分</h1>
        <p className="guide-body">
          訪客進入陳小均對話，交代、預約、查專案。員工用 Email 登入，直接進入自己的待辦、回報與訊息。
        </p>
        <div className="guide-actions">
          <Button type="button" className="h-12 flex-1" onClick={() => setMode("visitor")}>
            我是訪客
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1"
            onClick={() => setMode("staff")}
          >
            我是員工
          </Button>
        </div>
      </div>
    </div>
  );
}

function VisitorForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (name: string, phone: string) => void;
}) {
  const profile = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(VISITOR_PROFILE_KEY) || "{}") as {
        name?: string;
        phone?: string;
      };
    } catch {
      return {};
    }
  })();
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [error, setError] = useState("");

  function submit() {
    const n = name.trim();
    const p = phone.replace(/[^\d+]/g, "");
    const digits = p.replace(/\D/g, "");
    if (n.length < 2) {
      setError("請填真實姓名，至少兩個字。");
      return;
    }
    if (digits.length < 8 || digits.length > 13) {
      setError("請填聯絡電話，例如 0912345678。");
      return;
    }
    setError("");
    onSubmit(n, p);
  }

  return (
    <div className="app-shell">
      <div className="login-card">
        <p className="app-kicker">訪客</p>
        <h1>姓名與聯絡電話</h1>
        <p className="guide-body">工程師回覆時要找得到你。這台手機會記住，下次不用重填。</p>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">姓名</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：王小明"
            className="h-11 bg-white"
          />
        </label>
        <label className="mt-[0.7rem] grid gap-1.5">
          <span className="text-sm font-medium">聯絡電話</span>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="h-11 bg-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <div className="guide-actions">
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={onBack}>
            返回
          </Button>
          <Button type="button" className="h-11 flex-1" onClick={submit}>
            進入陳小均
          </Button>
        </div>
      </div>
    </div>
  );
}

function StaffForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (email: string) => string | null;
}) {
  const remembered = rememberedLoginEmails();
  const [email, setEmail] = useState(remembered[0] ?? "");
  const [error, setError] = useState("");

  return (
    <div className="app-shell">
      <div className="login-card">
        <p className="app-kicker">員工</p>
        <h1>員工登入</h1>
        <p className="guide-body">
          請輸入已登記的 Gmail。黃侯諴、陳彥均、簡宏義、張亭媛、張友山、林佑安換手機也能登入。
        </p>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">登入 Email</span>
          <Input
            type="email"
            list="jun-login-emails"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            className="h-11 bg-white"
            autoComplete="username"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setError(onSubmit(email) ?? "");
              }
            }}
          />
          <datalist id="jun-login-emails">
            {remembered.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <div className="guide-actions">
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={onBack}>
            返回
          </Button>
          <Button
            type="button"
            className="h-11 flex-1"
            onClick={() => setError(onSubmit(email) ?? "")}
          >
            登入
          </Button>
        </div>
      </div>
    </div>
  );
}

export function bootstrapSession(): Session | null {
  if (typeof window === "undefined") return null;
  return loadSession();
}
