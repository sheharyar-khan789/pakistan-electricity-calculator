/**
 * Minimal browser environment for component tests. Import this FIRST in a
 * .test.tsx file, before React or Testing Library.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const g = globalThis as Record<string, unknown>;
const { window } = dom;

for (const key of [
  "window",
  "self",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLSelectElement",
  "HTMLFormElement",
  "Element",
  "Node",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "MutationObserver",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
] as const) {
  // defineProperty: some globals (e.g. navigator in Node ≥ 21) are getter-only.
  Object.defineProperty(globalThis, key, {
    value: (window as unknown as Record<string, unknown>)[key],
    configurable: true,
    writable: true,
  });
}

// APIs jsdom does not implement but the calculator uses.
window.Element.prototype.scrollIntoView = () => {};
g.CSS = { escape: (value: string) => value.replace(/[^\w-]/g, (c) => `\\${c}`) };
g.IS_REACT_ACT_ENVIRONMENT = true;
