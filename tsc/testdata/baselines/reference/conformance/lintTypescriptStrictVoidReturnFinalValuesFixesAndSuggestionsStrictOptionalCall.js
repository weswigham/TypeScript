//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesFixesAndSuggestionsStrictOptionalCall.ts] ////

//// [input.ts]
declare const value: { fn(): number } | undefined; const fn: () => void = () => value?.fn();

//// [input.ts]
declare const value: { fn(): number } | undefined; const fn: () => void = () => value?.fn();
