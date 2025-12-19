import { useEffect, useMemo, useRef, useState } from 'react';

type TypewriterTextProps = {
  text: string;
  /**
   * Base delay (ms) between printed characters.
   */
  speedMs?: number;
  /**
   * Extra random delay (0..speedJitterMs) added to each character.
   */
  speedJitterMs?: number;
  /**
   * Extra pause (ms) after punctuation characters like .,!?;:—
   */
  punctuationPauseMs?: number;
  /**
   * Optional sessionStorage key: when present, animation runs only once per session.
   */
  oncePerSessionKey?: string;
  /**
   * Delay before starting typing (ms).
   */
  startDelayMs?: number;
  /**
   * Whether to show a caret while typing.
   */
  showCaret?: boolean;
  /**
   * Caret element (defaults to a small block like a typewriter cursor).
   */
  caret?: React.ReactNode;
  className?: string;
};

const DEFAULT_PUNCTUATION = new Set(['.', ',', '!', '?', ';', ':', '—']);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TypewriterText({
  text,
  speedMs = 10,
  speedJitterMs = 8,
  punctuationPauseMs = 80,
  oncePerSessionKey,
  startDelayMs = 0,
  showCaret = true,
  caret,
  className,
}: TypewriterTextProps) {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const srOnlyStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    }),
    [],
  );

  const caretNode = useMemo(() => {
    if (caret !== undefined) return caret;
    return (
      <span
        className="inline-block w-1 h-5 bg-black ml-1"
        style={{ animation: index >= text.length ? 'none' : 'pulse 1s infinite' }}
        aria-hidden="true"
      />
    );
  }, [caret, index, text.length]);

  useEffect(() => {
    // Reset on text change
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (!text) return;

    // Accessibility + UX: honor reduced motion.
    if (prefersReducedMotion()) {
      setIndex(text.length);
      return;
    }

    if (oncePerSessionKey) {
      try {
        const seen = sessionStorage.getItem(oncePerSessionKey);
        if (seen) {
          setIndex(text.length);
          return;
        }
      } catch {
        // ignore
      }
    }

    const clear = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const scheduleNext = (delay: number) => {
      clear();
      timeoutRef.current = window.setTimeout(() => {
        setIndex((prev) => {
          const next = Math.min(prev + 1, text.length);
          return next;
        });
      }, delay);
    };

    if (index === 0 && startDelayMs > 0) {
      scheduleNext(startDelayMs);
      return () => clear();
    }

    if (index >= text.length) {
      if (oncePerSessionKey) {
        try {
          sessionStorage.setItem(oncePerSessionKey, 'true');
        } catch {
          // ignore
        }
      }
      clear();
      return;
    }

    const nextChar = text[index] ?? '';
    const jitter = speedJitterMs > 0 ? Math.floor(Math.random() * (speedJitterMs + 1)) : 0;
    const punctPause = DEFAULT_PUNCTUATION.has(nextChar) ? punctuationPauseMs : 0;
    scheduleNext(speedMs + jitter + punctPause);

    return () => clear();
  }, [index, oncePerSessionKey, punctuationPauseMs, speedJitterMs, speedMs, startDelayMs, text]);

  // Screen readers should receive the final text (no "typing" spam).
  const visible = text.slice(0, index);

  return (
    <span className={className}>
      {/* Keep full text for screen readers without showing it visually (even if Tailwind is not present). */}
      <span style={srOnlyStyle}>{text}</span>
      <span aria-hidden="true">
        {visible}
        {showCaret ? caretNode : null}
      </span>
    </span>
  );
}


