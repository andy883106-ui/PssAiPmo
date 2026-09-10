"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";
import { NOTICE_KEY } from "@/lib/staff";
import { speakZh, stopSpeak } from "@/lib/speak";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("jun-notice", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("jun-notice", cb);
  };
}

function readNotice() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NOTICE_KEY) || "";
}

export function setNoticeText(text: string) {
  window.localStorage.setItem(NOTICE_KEY, text);
  window.dispatchEvent(new Event("jun-notice"));
}

export function NoticeBar() {
  const text = useSyncExternalStore(subscribe, readNotice, () => "");
  const [speaking, setSpeaking] = useState(false);
  const duration = useMemo(() => Math.max(14, Math.round(text.length / 3)), [text]);

  if (!text) return null;

  return (
    <div className="notice-bar" role="status">
      <span className="notice-label">公告</span>
      <div className="notice-viewport">
        <p className="notice-track" style={{ animationDuration: `${duration}s` }}>
          <span>{text}</span>
          <span aria-hidden="true">{text}</span>
        </p>
      </div>
      <button
        type="button"
        className="notice-speak"
        onClick={() => {
          if (speaking) {
            stopSpeak();
            setSpeaking(false);
            return;
          }
          speakZh(text, {
            onStart: () => setSpeaking(true),
            onEnd: () => setSpeaking(false),
          });
        }}
      >
        <Volume2 className="size-3.5" />
        {speaking ? "停" : "唸"}
      </button>
    </div>
  );
}
