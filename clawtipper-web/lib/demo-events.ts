/** Full live demo: terminal reset + burst (handled in ActivityProvider). */
export const RUN_DEMO_EVENT = "clawtipper:run-demo";

/** Inject a single log line into the terminal (typing animation). */
export const TERMINAL_APPEND_EVENT = "clawtipper:terminal-append";

export function dispatchRunDemo() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RUN_DEMO_EVENT));
}

export function appendTerminalLine(line: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TERMINAL_APPEND_EVENT, { detail: line })
  );
}
