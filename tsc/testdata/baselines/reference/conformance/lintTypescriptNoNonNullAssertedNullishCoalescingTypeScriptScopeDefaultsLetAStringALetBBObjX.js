//// [tests/cases/conformance/lint/rules/no-non-null-asserted-nullish-coalescing/lintTypescriptNoNonNullAssertedNullishCoalescingTypeScriptScopeDefaultsLetAStringALetBBObjX.ts] ////

//// [input.ts]
let a: string; a! ?? ''; let b = ''; b! ?? ''; obj.x! ?? '';

//// [input.ts]
let a: string; a! ?? ''; let b = ''; b! ?? ''; obj.x! ?? '';
