import { useEffect, useRef } from 'react';

/**
 * Moves keyboard and screen-reader focus to the step heading whenever the step changes
 * (Addendum F3 & Master Prompt Section 5).
 */
export function useStepFocus<T>(stepTrigger: T) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = headingRef.current;
    if (el) {
      el.focus({ preventScroll: false });
    }
  }, [stepTrigger]);

  return headingRef;
}
