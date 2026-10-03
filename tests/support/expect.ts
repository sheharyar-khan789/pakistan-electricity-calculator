import assert from "node:assert/strict";
import { it } from "node:test";

/** Minimal expect() over node:assert, so tests read naturally. */
export function expect<T>(actual: T) {
  const matchers = {
    toBe: (expected: unknown) => assert.equal(actual, expected),
    toEqual: (expected: unknown) => assert.deepEqual(actual, expected),
    toBeNull: () => assert.equal(actual, null),
    toBeTruthy: () => assert.ok(actual),
    toMatch: (re: RegExp) => assert.match(String(actual), re),
    toContain: (item: unknown) =>
      typeof actual === "string"
        ? assert.ok(actual.includes(String(item)), `expected "${actual}" to contain "${String(item)}"`)
        : assert.ok((actual as unknown[]).includes(item), `expected array to contain ${String(item)}`),
    toHaveLength: (n: number) => assert.equal((actual as { length: number }).length, n),
    toBeLessThan: (n: number) => assert.ok((actual as number) < n, `${String(actual)} < ${n}`),
    toBeGreaterThan: (n: number) => assert.ok((actual as number) > n, `${String(actual)} > ${n}`),
    toThrow: (errorClass?: new (...args: never[]) => Error) =>
      errorClass ? assert.throws(actual as () => unknown, errorClass) : assert.throws(actual as () => unknown),
  };
  const not = {
    toBe: (expected: unknown) => assert.notEqual(actual, expected),
    toContain: (item: unknown) =>
      assert.ok(!String(actual).includes(String(item)), `expected not to contain "${String(item)}"`),
  };
  return { ...matchers, not };
}

function title(template: string, args: readonly unknown[]): string {
  let i = 0;
  return template.replace(/%[sid]/g, () => String(args[i++]));
}

/** Table-driven tests: each(cases)("%i units", (units, …) => …). */
export function each<Row extends unknown[]>(rows: readonly Row[]) {
  return (name: string, fn: (...args: Row) => void | Promise<void>) => {
    for (const row of rows) it(title(name, row), () => fn(...row));
  };
}

/** Single-value table: eachValue([1, 2])("%s", (v) => …). */
export function eachValue<V>(values: readonly V[]) {
  return (name: string, fn: (value: V) => void | Promise<void>) => {
    for (const value of values) it(title(name, [value]), () => fn(value));
  };
}
