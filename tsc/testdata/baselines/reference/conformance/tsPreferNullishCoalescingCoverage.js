//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/tsPreferNullishCoalescingCoverage.ts] ////

//// [input.ts]
declare const nullable: string | null;
const logical = nullable || "default";
const conditional = nullable == null ? "default" : nullable;

declare let mutable: string | null;
mutable ||= "default";

const coalesced = nullable ?? "default";
declare const text: string;
const emptyStringFallback = text || "default";
if (nullable || "default") {}

//// [input.ts]
declare const nullable: string | null;
const logical = nullable || "default";
const conditional = nullable == null ? "default" : nullable;

declare let mutable: string | null;
mutable ||= "default";

const coalesced = nullable ?? "default";
declare const text: string;
const emptyStringFallback = text || "default";
if (nullable || "default") {}
