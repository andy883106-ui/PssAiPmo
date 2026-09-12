import { dayKey } from "@/lib/utils";

export const QUICK_OPTIONS = ["回報工作", "派工給同事", "預排時段", "上傳圖面", "只是打招呼"] as const;

export type AssistantSession = {
  step: "idle" | "serve" | "today" | "tomorrow" | "confirm";
  who: string;
  today: string;
};

export type AssistantResult = {
  handled: boolean;
  session: AssistantSession;
  reply: string;
  options: string[];
  commit?: { who: string; text: string };
};

export function idleSession(who = "陳彥均", today = dayKey()): AssistantSession {
  return { step: "idle", who, today };
}

function isWhoAsk(text: string) {
  return /你是誰|你叫什麼|你是什麼人|誰是陳小均/.test(text);
}

function isCallJun(text: string) {
  const t = text.trim();
  return (
    /^(陳小均|小均|呼叫小均|叫小均|小均小均)[，,！!。.~～]*$/.test(t) ||
    /需要.+服務|為我服務|幫我忙/.test(t)
  );
}

export function handleAssistant(
  input: string,
  session: AssistantSession,
  who = "陳彥均",
): AssistantResult {
  const text = input.trim();
  const base = session.step === "idle" ? idleSession(who || session.who, session.today) : session;
  const actor = base.who || who;

  if (/^(取消|算了|不用了|先不要)[。．.！!]*$/.test(text)) {
    return {
      handled: true,
      session: idleSession(actor, base.today),
      reply: "好，這則先不算。需要我時再按「呼叫小均」，或直接點我。",
      options: [...QUICK_OPTIONS],
    };
  }

  if (base.step === "idle" && (isCallJun(text) || isWhoAsk(text))) {
    return {
      handled: true,
      session: { step: "serve", who: actor, today: base.today },
      reply: isWhoAsk(text)
        ? "我是陳小均，彥均的助手分身。每天工作、派工、圖面都可以交給我。需要陳小均為您服務什麼？"
        : "嗨，我是陳小均，彥均的助手分身。需要陳小均為您服務什麼？",
      options: [...QUICK_OPTIONS],
    };
  }

  if (base.step === "serve") {
    if (/回報/.test(text)) {
      return {
        handled: true,
        session: { ...base, step: "today" },
        reply: "好。請說哪一天、哪些時段、做了什麼。例如：9/8 09:00-12:00 文書處理。",
        options: [],
      };
    }
    if (/派工|交代|預排/.test(text)) {
      return {
        handled: true,
        session: idleSession(actor, base.today),
        reply:
          "好。請用一句話寫清楚：誰、什麼事、何時要完成。接上雲端後我會寫進主資料庫；現在會先存在這台裝置。",
        options: [...QUICK_OPTIONS],
      };
    }
    if (/圖面|繪圖|上傳/.test(text)) {
      return {
        handled: true,
        session: base,
        reply: "好，請把圖面檔名與專案名稱寫在訊息裡。接上雲端後會放到該專案圖面資料夾。",
        options: [...QUICK_OPTIONS],
      };
    }
    if (/打招呼|只是/.test(text)) {
      return {
        handled: true,
        session: base,
        reply: "我在這裡。想回報、派工或丟圖面，隨時點我。",
        options: [...QUICK_OPTIONS],
      };
    }
  }

  if (base.step === "today" || base.step === "tomorrow") {
    if (/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(text) || /文書|會議|測試|考試|整天/.test(text)) {
      return {
        handled: true,
        session: idleSession(actor, base.today),
        reply: "好，已幫您記下這段工作。之後要改再跟我說。",
        options: [...QUICK_OPTIONS],
        commit: { who: actor, text },
      };
    }
    return {
      handled: true,
      session: base,
      reply: "請補時段，例如 09:00-12:00 文書處理。",
      options: [],
    };
  }

  if (!text) {
    return { handled: false, session: base, reply: "", options: [] };
  }

  // Fallback local help for visitors / general chat
  if (/專案|進度|預約|會勘|請款|圖面/.test(text)) {
    return {
      handled: true,
      session: base,
      reply:
        "收到。我會先記在這台裝置。管理者接上 Apps Script 雲端後，就能同步到工作表與 Drive。",
      options: [...QUICK_OPTIONS],
      commit: { who: actor, text },
    };
  }

  return {
    handled: true,
    session: { step: "serve", who: actor, today: base.today },
    reply: "我聽到了。可以直接說「回報工作」、「派工給同事」，或點下面選項。",
    options: [...QUICK_OPTIONS],
  };
}
