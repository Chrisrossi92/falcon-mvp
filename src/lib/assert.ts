export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}
