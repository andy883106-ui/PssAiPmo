let current: SpeechSynthesisUtterance | null = null;

export function speakZh(
  text: string,
  opts?: { onStart?: () => void; onEnd?: () => void },
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  stopSpeak();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-TW";
  u.rate = 1.02;
  u.onstart = () => opts?.onStart?.();
  u.onend = () => {
    current = null;
    opts?.onEnd?.();
  };
  current = u;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  current = null;
}
