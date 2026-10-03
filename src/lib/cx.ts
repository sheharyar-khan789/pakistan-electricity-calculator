/** Joins truthy class names. Tiny replacement for `clsx`. */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
