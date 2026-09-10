"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  speaking?: boolean;
  onClick?: () => void;
};

export function JunBuddy({ speaking = false, onClick }: Props) {
  const [pos, setPos] = useState({ x: 18, y: 120 });

  useEffect(() => {
    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPos({
        x: Math.max(12, Math.min(w - 100, 20 + Math.sin(Date.now() / 4200) * 28)),
        y: Math.max(90, Math.min(h - 140, h * 0.55 + Math.cos(Date.now() / 5100) * 24)),
      });
    };
    tick();
    const id = window.setInterval(tick, 1200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      className={`jun-buddy ${speaking ? "jun-speaking" : ""}`}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      onClick={onClick}
      aria-label="呼叫陳小均"
    >
      <span className="jun-glow" aria-hidden />
      <Image
        src="/chen-xiaojun-animated.webp"
        alt="陳小均"
        width={86}
        height={86}
        className="jun-photo"
        priority
        unoptimized
      />
    </button>
  );
}
