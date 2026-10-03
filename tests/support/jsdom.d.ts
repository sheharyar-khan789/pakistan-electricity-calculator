/** Minimal typing for the parts of jsdom the test setup uses. */
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: { url?: string; pretendToBeVisual?: boolean });
    readonly window: Window & typeof globalThis;
  }
}
