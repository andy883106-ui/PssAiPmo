export type StaffSeat = {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
};

export const OWNER_NAME = "陳彥均";
export const ADMIN_EMAIL_KEY = "jun-admin-email-v1";
export const LOGIN_EMAILS_KEY = "jun-login-emails-v1";
export const SESSION_KEY = "jun-session-v1";
export const STAFF_SEATS_KEY = "jun-staff-seats-v1";
export const ACTING_KEY = "jun-acting-v1";
export const VISITOR_ID_KEY = "jun-visitor-id-v1";
export const VISITOR_PROFILE_KEY = "jun-visitor-profile-v1";
export const NOTICE_KEY = "jun-notice-text-v1";
export const GAS_SETUP_KEY = "jun-gas-setup-v1";

export const DEFAULT_STAFF: StaffSeat[] = [
  { id: "huang", name: "黃侯諴", email: "assam001@gmail.com", enabled: true },
  { id: "chen", name: "陳彥均", email: "andy883106@gmail.com", enabled: true },
  { id: "jian", name: "簡宏義", email: "jeff0936216950@gmail.com", enabled: true },
  { id: "zhang", name: "張亭媛", email: "yuan77718@gmail.com", enabled: true },
  { id: "youshan", name: "張友山", email: "a0922158016@gmail.com", enabled: true },
  { id: "lin", name: "林佑安", email: "jerry122924@gmail.com", enabled: true },
  { id: "pm", name: "未來PM", email: "", enabled: false },
];

export function normEmail(email: string) {
  return email.trim().toLowerCase();
}

export function loadStaffSeats(): StaffSeat[] {
  if (typeof window === "undefined") return DEFAULT_STAFF.map((s) => ({ ...s }));
  try {
    const raw = window.localStorage.getItem(STAFF_SEATS_KEY);
    if (!raw) return DEFAULT_STAFF.map((s) => ({ ...s }));
    const parsed = JSON.parse(raw) as StaffSeat[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_STAFF.map((s) => ({ ...s }));
    }
    return mergeSeats(parsed);
  } catch {
    return DEFAULT_STAFF.map((s) => ({ ...s }));
  }
}

function mergeSeats(extra: StaffSeat[]): StaffSeat[] {
  const map = new Map(extra.map((s) => [s.id, s]));
  const knownEmails = new Set(
    DEFAULT_STAFF.map((s) => normEmail(s.email)).filter(Boolean),
  );
  return [
    ...DEFAULT_STAFF.map((base) => {
      const over = map.get(base.id);
      if (!over) return { ...base, enabled: !!base.email.trim() };
      const name = (over.name || base.name).trim() || base.name;
      const email = base.email.trim() || over.email.trim();
      return { ...base, ...over, id: base.id, name, email, enabled: !!email };
    }),
    ...[...map.values()].filter((s) => {
      if (DEFAULT_STAFF.some((b) => b.id === s.id)) return false;
      const email = normEmail(s.email);
      return !(email && knownEmails.has(email));
    }),
  ];
}

export function adminEmail() {
  if (typeof window === "undefined") return "andy883106@gmail.com";
  return normEmail(window.localStorage.getItem(ADMIN_EMAIL_KEY) || "andy883106@gmail.com");
}

export function rememberedLoginEmails(): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(LOGIN_EMAILS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function rememberLoginEmail(email: string) {
  const list = rememberedLoginEmails();
  const next = [normEmail(email), ...list.filter((e) => normEmail(e) !== normEmail(email))].slice(0, 12);
  window.localStorage.setItem(LOGIN_EMAILS_KEY, JSON.stringify(next));
}

export type Session =
  | { role: "visitor"; name: string; phone: string; visitorId: string }
  | { role: "staff"; email: string; name: string }
  | { role: "admin"; email: string; name: string };

/** Admin impersonation target (visitor or staff seat). */
export type ActingIdentity =
  | { role: "visitor"; name: string; phone: string; visitorId: string }
  | { role: "staff"; email: string; name: string }
  | null;

export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function matchStaffByEmail(email: string, seats = loadStaffSeats()) {
  const target = normEmail(email);
  return seats.find((s) => s.enabled && normEmail(s.email) === target) ?? null;
}

export function isAdminEmail(email: string) {
  return normEmail(email) === adminEmail();
}

export function loginByEmail(email: string): Session | { error: string } {
  const normalized = normEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: "請輸入正確的 Gmail 格式。" };
  }
  if (isAdminEmail(normalized)) {
    const seat = matchStaffByEmail(normalized);
    return {
      role: "admin",
      email: normalized,
      name: seat?.name || OWNER_NAME,
    };
  }
  const seat = matchStaffByEmail(normalized);
  if (!seat) {
    return { error: "這組 Email 還沒登記。請用已登記的 Gmail，或請管理者開通。" };
  }
  return { role: "staff", email: seat.email, name: seat.name };
}

export function loadActing(): ActingIdentity {
  try {
    const raw = window.localStorage.getItem(ACTING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActingIdentity;
  } catch {
    return null;
  }
}

export function saveActing(acting: ActingIdentity) {
  if (!acting) {
    window.localStorage.removeItem(ACTING_KEY);
    return;
  }
  window.localStorage.setItem(ACTING_KEY, JSON.stringify(acting));
}

/** Effective desk identity: admin can act as visitor/staff. */
export function effectiveIdentity(session: Session): Session {
  if (session.role !== "admin") return session;
  const acting = loadActing();
  if (!acting) return session;
  return acting;
}

export function clearAuth() {
  saveSession(null);
  saveActing(null);
}
