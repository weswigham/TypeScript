//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableOtherKeywords.ts] ////

//// [input.ts]
const a: bigint = -10n; const b: null = null; const c: undefined = void 0; const d: symbol = Symbol?.();

//// [input.ts]
const a = -10n; const b = null; const c = void 0; const d = Symbol?.();
