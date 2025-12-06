
import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void | (() => void), deps: unknown[], wait = 500) {
  const timeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const res = effect();
      // allow effect to return cleanup
      if (typeof res === "function") return res;
    }, wait);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
