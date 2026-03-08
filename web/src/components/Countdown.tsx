import { useState, useEffect, useCallback } from "react";

interface Props {
  onComplete: () => void;
}

export function Countdown({ onComplete }: Props) {
  const [count, setCount] = useState(3);
  const [animClass, setAnimClass] = useState("countdown-enter");

  const tick = useCallback(() => {
    setAnimClass("countdown-exit");

    setTimeout(() => {
      setCount((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          onComplete();
          return 0;
        }
        setAnimClass("countdown-enter");
        return next;
      });
    }, 300);
  }, [onComplete]);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(tick, 700);
    return () => clearTimeout(timer);
  }, [count, tick]);

  if (count <= 0) return null;

  return <span className={`text-6xl sm:text-7xl font-black text-white drop-shadow-lg ${animClass}`}>{count}</span>;
}
