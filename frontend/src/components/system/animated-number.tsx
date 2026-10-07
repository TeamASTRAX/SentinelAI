"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
    let frame = 0;
    let started: number | undefined;
    const tick = (now: number) => {
      started ??= now;
      const progress = Math.max(0, Math.min(1, duration === 0 ? 1 : (now - started) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span aria-label={value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}><span aria-hidden="true">{display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span></span>;
}
