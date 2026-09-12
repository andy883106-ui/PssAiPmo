"use client";

import { useState } from "react";
import { AdminHub } from "@/components/AdminHub";
import { StaffDesk } from "@/components/StaffDesk";
import { VisitorChat } from "@/components/VisitorChat";
import {
  clearAuth,
  effectiveIdentity,
  loadActing,
  saveActing,
  type Session,
} from "@/lib/staff";

type Props = {
  session: Session;
  onLogout: () => void;
};

export function RoleDesk({ session, onLogout }: Props) {
  const [nonce, setNonce] = useState(0);
  const [forceStaff, setForceStaff] = useState(false);
  const [forceChat, setForceChat] = useState(false);
  void nonce;

  function refresh() {
    setNonce((n) => n + 1);
  }

  function logout() {
    clearAuth();
    onLogout();
  }

  const acting = loadActing();
  const view = effectiveIdentity(session);

  if (session.role === "admin" && !acting && !forceStaff && !forceChat) {
    return (
      <AdminHub
        session={session}
        onLogout={logout}
        onEnterStaffDesk={() => {
          setForceStaff(true);
          setForceChat(false);
        }}
        onRefreshIdentity={() => {
          setForceStaff(false);
          setForceChat(false);
          refresh();
        }}
      />
    );
  }

  if ((view.role === "staff" || forceStaff) && !forceChat) {
    const staffSession =
      view.role === "staff"
        ? view
        : session.role === "admin"
          ? { role: "staff" as const, email: session.email, name: session.name }
          : null;
    if (!staffSession) {
      return (
        <VisitorChat
          session={view.role === "visitor" ? view : session}
          onLogout={logout}
        />
      );
    }
    return (
      <StaffDesk
        session={staffSession}
        actingFromAdmin={session.role === "admin"}
        onLogout={logout}
        onBackToAdmin={
          session.role === "admin"
            ? () => {
                saveActing(null);
                setForceStaff(false);
                setForceChat(false);
                refresh();
              }
            : undefined
        }
        onOpenChat={() => {
          setForceChat(true);
          setForceStaff(false);
        }}
      />
    );
  }

  const chatSession =
    view.role === "visitor"
      ? view
      : view.role === "staff"
        ? view
        : session.role === "admin"
          ? ({
              role: "staff" as const,
              email: session.email,
              name: session.name,
            } satisfies Session)
          : session;

  return (
    <div className="relative">
      {session.role === "admin" ? (
        <div className="admin-chat-bar">
          <button
            type="button"
            className="chip"
            onClick={() => {
              setForceChat(false);
              setForceStaff(false);
              saveActing(null);
              refresh();
            }}
          >
            回總網
          </button>
        </div>
      ) : null}
      <VisitorChat session={chatSession} onLogout={logout} />
    </div>
  );
}
