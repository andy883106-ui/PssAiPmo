"use client";

import { useEffect, useState } from "react";
import { DeskErrorBoundary } from "@/components/DeskErrorBoundary";
import { IdentityGate, bootstrapSession } from "@/components/IdentityGate";
import { NoticeBar } from "@/components/NoticeBar";
import { RoleDesk } from "@/components/RoleDesk";
import type { Session } from "@/lib/staff";

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(bootstrapSession());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="login-card">
          <p className="app-kicker">陳小均</p>
          <h1>陳小均準備中…</h1>
        </div>
      </div>
    );
  }

  return (
    <DeskErrorBoundary>
      <NoticeBar />
      {session ? (
        <RoleDesk session={session} onLogout={() => setSession(null)} />
      ) : (
        <IdentityGate onReady={setSession} />
      )}
    </DeskErrorBoundary>
  );
}
