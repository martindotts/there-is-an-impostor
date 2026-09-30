import { useEffect, useRef } from 'react';

/**
 * Browser / phone back button support. The app navigates with React state,
 * not URLs, so on its own the back button would leave the site from any
 * screen. Instead, whatever can currently be "backed out of" (a sub-screen,
 * a modal, a setup step) registers a handler here; while at least one is
 * registered the app keeps a single extra history entry, and popping it runs
 * the most recently registered handler instead of leaving.
 */
const handlers: Array<() => void> = [];
let armed = false;
// Set when we pop our own entry (nothing left to back out of), so that
// popstate isn't mistaken for a back press.
let ignoreNextPop = false;

function sync() {
  if (handlers.length > 0 && !armed) {
    history.pushState(null, '');
    armed = true;
  } else if (handlers.length === 0 && armed) {
    armed = false;
    ignoreNextPop = true;
    history.back();
  }
}

window.addEventListener('popstate', () => {
  if (ignoreNextPop) {
    ignoreNextPop = false;
    return;
  }
  armed = false;
  handlers[handlers.length - 1]?.();
  // Re-arm right away; if the handler leaves nothing to back out of, its
  // unregistration drops the entry again.
  sync();
});

/** While `active`, the back button calls `onBack` instead of leaving the app.
 *  Handlers registered later (e.g. a modal over a screen) take precedence. */
export function useBackHandler(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const handler = () => onBackRef.current();
    handlers.push(handler);
    sync();
    return () => {
      handlers.splice(handlers.indexOf(handler), 1);
      sync();
    };
  }, [active]);
}
