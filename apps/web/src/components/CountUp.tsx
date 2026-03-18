import { useEffect, useRef, useCallback } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  formatter?: (n: number) => string;
  className?: string;
}

export function CountUp({ end, duration = 800, formatter, className }: CountUpProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  const format = useCallback(
    (n: number) => (formatter ? formatter(n) : Math.round(n).toString()),
    [formatter]
  );

  useEffect(() => {
    startTime.current = null;
    const node = spanRef.current;
    if (!node) return;

    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * end;

      // Update DOM directly — no setState per frame
      node!.textContent = format(value);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    }

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [end, duration, format]);

  return <span ref={spanRef} className={className}>{format(0)}</span>;
}
