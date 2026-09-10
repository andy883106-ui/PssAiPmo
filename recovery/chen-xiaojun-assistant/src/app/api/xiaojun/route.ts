import { NextResponse } from "next/server";

const ALLOWED = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

type Body = {
  action?: string;
  url?: string;
  secret?: string;
  [key: string]: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "資料格式不對" }, { status: 400 });
  }

  const url = String(body.url || process.env.XIAOJUN_GAS_URL || "").trim();
  const secret = String(body.secret || process.env.XIAOJUN_GAS_SECRET || "").trim();
  const action = String(body.action || "").trim();

  if (!url || !secret) {
    return NextResponse.json({
      ok: false,
      needSetup: true,
      error: "還沒接上雲端。請管理者在總網填主程式網址和密鑰，或設定 Vercel 環境變數。",
    });
  }
  if (!ALLOWED.test(url)) {
    return NextResponse.json({ ok: false, error: "請貼 Apps Script 的 /exec 網址" }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ ok: false, error: "缺少動作" }, { status: 400 });
  }

  const payload = { ...body };
  delete payload.url;
  payload.secret = secret;
  payload.action = action;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    const text = await response.text();
    if (text.includes("<HTML") || text.includes("<html") || text.includes("accounts.google.com")) {
      return NextResponse.json({
        ok: false,
        error: "主程式要重新部署：執行身分選「我」，誰可以存取選「任何人」。",
      });
    }
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({
        ok: false,
        error: "主程式沒有回傳資料。請確認已部署成網頁應用程式。",
      });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "連不到主程式，請再試一次。" });
  }
}
