//// [tests/cases/conformance/lint/rules/strict-boolean-expressions/booleanRuleFileState.ts] ////

//// [first.ts]
declare const value: { enabled: boolean } | undefined;
declare const count: number | undefined;
export const enabled = value && value.enabled;
if (count) {}
//// [second.ts]
declare const value: { enabled: boolean } | undefined;
declare const count: number | undefined;
export const enabled = value && value.enabled;
if (count) {}


//// [first.ts]
declare const value: { enabled: boolean } | undefined;
declare const count: number | undefined;
export const enabled = value?.enabled;
if (count) {}
//// [second.ts]
declare const value: { enabled: boolean } | undefined;
declare const count: number | undefined;
export const enabled = value?.enabled;
if (count) {}
