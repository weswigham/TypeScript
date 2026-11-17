//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesFixesAndSuggestionsStrictAwait.ts] ////

//// [input.ts]
const fn: () => void = async () => await Promise.resolve();

//// [input.ts]
const fn: () => void = async () => await Promise.resolve();
