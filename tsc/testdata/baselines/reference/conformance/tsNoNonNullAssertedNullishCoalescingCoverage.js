//// [tests/cases/conformance/lint/rules/no-non-null-asserted-nullish-coalescing/tsNoNonNullAssertedNullishCoalescingCoverage.ts] ////

//// [input.ts]
export {};
let unassigned: string;
unassigned! ?? "fallback";
declare const object: { text?: string };
object.text! ?? "fallback";
let initialized = "ready";
initialized! ?? "fallback";
object.text ?? "fallback";
initialized ?? "fallback";

//// [input.ts]
export {};
let unassigned: string;
unassigned! ?? "fallback";
declare const object: { text?: string };
object.text! ?? "fallback";
let initialized = "ready";
initialized! ?? "fallback";
object.text ?? "fallback";
initialized ?? "fallback";
