import { GAS_SETUP_KEY } from "@/lib/staff";

export type GasSetup = { url: string; secret: string };

export function loadGasSetup(): GasSetup {
  try {
    const raw = window.localStorage.getItem(GAS_SETUP_KEY);
    if (!raw) return { url: "", secret: "" };
    const parsed = JSON.parse(raw) as GasSetup;
    return { url: parsed.url || "", secret: parsed.secret || "" };
  } catch {
    return { url: "", secret: "" };
  }
}

export function saveGasSetup(setup: GasSetup) {
  window.localStorage.setItem(GAS_SETUP_KEY, JSON.stringify(setup));
}

export async function callCloud(action: string, payload: Record<string, unknown> = {}) {
  const setup = loadGasSetup();
  const body = {
    action,
    ...payload,
    url: setup.url,
    secret: setup.secret,
  };
  const res = await fetch("/api/xiaojun", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
