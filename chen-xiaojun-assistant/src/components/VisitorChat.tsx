"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, SendHorizontal, Settings2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JunBuddy } from "@/components/JunBuddy";
import { setNoticeText } from "@/components/NoticeBar";
import {
  handleAssistant,
  idleSession,
  QUICK_OPTIONS,
  type AssistantSession,
} from "@/lib/assistant";
import { callCloud, loadGasSetup, saveGasSetup } from "@/lib/cloud";
import { speakZh, stopSpeak } from "@/lib/speak";
import {
  adminEmail,
  saveSession,
  type Session,
} from "@/lib/staff";
import {
  addWorkLog,
  appendChat,
  loadChat,
  loadWorkLogs,
  type ChatMessage,
  type WorkLog,
} from "@/lib/storage";
import { dayKey } from "@/lib/utils";

type Props = {
  session: Session;
  onLogout: () => void;
};

export function VisitorChat({ session, onLogout }: Props) {
  const threadKey =
    session.role === "visitor" ? `visitor:${session.visitorId}` : `staff:${session.email}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [draft, setDraft] = useState("");
  const [options, setOptions] = useState<string[]>([...QUICK_OPTIONS]);
  const [assistant, setAssistant] = useState<AssistantSession>(() =>
    idleSession(session.role === "staff" ? session.name : "訪客", dayKey()),
  );
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [tab, setTab] = useState<"chat" | "logs" | "setup">("chat");
  const [gasUrl, setGasUrl] = useState("");
  const [gasSecret, setGasSecret] = useState("");
  const [setupMsg, setSetupMsg] = useState("");
  const [listening, setListening] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const title = session.role === "visitor" ? session.name : session.name;
  const kicker = session.role === "visitor" ? "訪客對話" : "員工工作台";

  useEffect(() => {
    document.body.classList.add("chat-lock");
    const root = document.documentElement;
    const vv = window.visualViewport;
    const sync = () => {
      if (!vv) {
        root.style.setProperty("--vv-height", `${window.innerHeight}px`);
        return;
      }
      root.style.setProperty("--vv-height", `${Math.round(vv.height)}px`);
      root.style.setProperty("--vv-offset", `${Math.round(vv.offsetTop)}px`);
      const gap = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      root.style.setProperty("--kb-gap", `${gap}px`);
      root.classList.toggle("kb-open", gap > 80);
    };
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      document.body.classList.remove("chat-lock");
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    const existing = loadChat(threadKey);
    if (existing.length) {
      setMessages(existing);
    } else {
      const greeting = appendChat(threadKey, {
        role: "assistant",
        author: "陳小均",
        text: "嗨，我是陳小均，彥均的助手分身。需要陳小均為您服務什麼？",
      });
      setMessages([greeting]);
    }
    setLogs(loadWorkLogs());
    const setup = loadGasSetup();
    setGasUrl(setup.url);
    setGasSecret(setup.secret);
    if (!window.localStorage.getItem("jun-notice-text-v1")) {
      setNoticeText("陳小均助理已復原運行。接上雲端後可同步工作表與 Drive。");
    }
  }, [threadKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, tab]);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.text || "",
    [messages],
  );

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setDraft("");
    const userMsg = appendChat(threadKey, {
      role: "user",
      author: title,
      text,
    });
    setMessages((prev) => [...prev, userMsg]);

    const result = handleAssistant(text, assistant, session.role === "staff" ? session.name : "訪客");
    setAssistant(result.session);
    if (result.options.length) setOptions(result.options);

    if (result.commit) {
      addWorkLog({
        title: `${result.commit.who} · ${dayKey()}`,
        content: result.commit.text,
        tags: ["local", session.role],
        author: result.commit.who,
      });
      setLogs(loadWorkLogs());
      try {
        await callCloud("report", {
          who: result.commit.who,
          text: result.commit.text,
          day: dayKey(),
        });
      } catch {
        /* offline ok */
      }
    }

    if (result.handled && result.reply) {
      const bot = appendChat(threadKey, {
        role: "assistant",
        author: "陳小均",
        text: result.reply,
      });
      setMessages((prev) => [...prev, bot]);
      if (autoSpeak) {
        speakZh(result.reply, {
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false),
        });
      }
    }
  }

  function toggleMic() {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      setSetupMsg("這台裝置不支援語音輸入，請直接打字。");
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "zh-TW";
    rec.interimResults = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const said = event.results[0]?.[0]?.transcript || "";
      if (said) void sendText(said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function saveSetup() {
    saveGasSetup({ url: gasUrl.trim(), secret: gasSecret.trim() });
    const ping = await callCloud("help", {});
    if (ping?.needSetup) {
      setSetupMsg(ping.error || "還沒接上雲端。");
    } else if (ping?.ok === false) {
      setSetupMsg(ping.error || "連線失敗，請檢查網址與密鑰。");
    } else {
      setSetupMsg("已儲存。雲端回應正常或已接受設定。");
      setNoticeText("雲端設定已更新。陳小均可同步工作事項。");
    }
  }

  const isAdmin =
    session.role === "staff" && session.email.toLowerCase() === adminEmail();

  return (
    <div className="app-shell chat-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">{kicker}</p>
          <h1>陳小均助理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setAutoSpeak((v) => !v)}
          >
            {autoSpeak ? "自動唸開" : "自動唸關"}
          </Button>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => {
              saveSession(null);
              onLogout();
            }}
          >
            <LogOut className="size-4" />
            登出
          </Button>
        </div>
      </header>

      <div className="desktop-grid">
        <aside className="companion-panel hidden md:flex">
          <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/chen-xiaojun-animated.webp"
              alt="陳小均"
              className={`jun-photo h-full w-full object-cover ${speaking ? "animate-[jun-talk_.45s_ease-in-out_infinite]" : "animate-[jun-breathe_3.2s_ease-in-out_infinite]"}`}
            />
          </div>
          <div className="speech-bubble">{latestAssistant || "點我或按呼叫小均。"}</div>
          <Button
            className="mt-3 h-11 w-full"
            onClick={() => void sendText("呼叫小均")}
          >
            呼叫小均
          </Button>
        </aside>

        <section className="main-panel">
          <div className="main-tabs">
            <div className="tabs-bar">
              <div className="quick-row">
                <button
                  type="button"
                  className={`chip ${tab === "chat" ? "chip-on" : ""}`}
                  onClick={() => setTab("chat")}
                >
                  對話
                </button>
                <button
                  type="button"
                  className={`chip ${tab === "logs" ? "chip-on" : ""}`}
                  onClick={() => setTab("logs")}
                >
                  本機紀錄
                </button>
                {isAdmin || session.role === "staff" ? (
                  <button
                    type="button"
                    className={`chip ${tab === "setup" ? "chip-on" : ""}`}
                    onClick={() => setTab("setup")}
                  >
                    <Settings2 className="size-4" />
                    雲端
                  </button>
                ) : null}
              </div>
            </div>

            <div className="panel-body">
              {tab === "chat" ? (
                <>
                  <div ref={listRef} className="message-list min-h-0 flex-1 overflow-y-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}
                      >
                        <strong>{m.author}</strong>
                        <p>{m.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="composer">
                    <div className="quick-row mb-2">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className="chip"
                          onClick={() => void sendText(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <div className="chat-composer-row grid">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="跟陳小均說…"
                        className="min-h-[5.6rem] w-full resize-none rounded-xl border border-input bg-white/90 p-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void sendText(draft);
                          }
                        }}
                      />
                      <Button
                        variant={listening ? "default" : "outline"}
                        className={`voice-mic h-14 ${listening ? "voice-mic-on" : ""}`}
                        onClick={toggleMic}
                      >
                        <Mic className="size-4" />
                        {listening ? "停" : "講"}
                      </Button>
                      <Button className="h-14" onClick={() => void sendText(draft)}>
                        <SendHorizontal className="size-4" />
                        送出
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}

              {tab === "logs" ? (
                <div className="pmo-list overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="guide-body">尚無本機工作紀錄。</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="desk-card">
                        <strong>{log.title}</strong>
                        <p className="guide-body whitespace-pre-wrap">{log.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("zh-TW")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              {tab === "setup" ? (
                <div className="desk-card space-y-3">
                  <h2>接上 Google Apps Script</h2>
                  <p className="guide-body">
                    貼上 `/exec` 網址與密鑰。也可改用 Vercel 環境變數 `XIAOJUN_GAS_URL`、
                    `XIAOJUN_GAS_SECRET`。
                  </p>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium">GAS /exec 網址</span>
                    <Input
                      value={gasUrl}
                      onChange={(e) => setGasUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="h-11 bg-white"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium">密鑰</span>
                    <Input
                      value={gasSecret}
                      onChange={(e) => setGasSecret(e.target.value)}
                      placeholder="XIAOJUN_GAS_SECRET"
                      className="h-11 bg-white"
                    />
                  </label>
                  {setupMsg ? <p className="login-error">{setupMsg}</p> : null}
                  <Button className="h-11" onClick={() => void saveSetup()}>
                    儲存並測試
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <JunBuddy
        speaking={speaking}
        onClick={() => {
          stopSpeak();
          void sendText("呼叫小均");
        }}
      />
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}
