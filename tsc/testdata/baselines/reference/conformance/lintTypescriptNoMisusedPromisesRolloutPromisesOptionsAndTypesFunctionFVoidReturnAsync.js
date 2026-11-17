//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesFunctionFVoidReturnAsync.ts] ////

//// [input.ts]
function f(): () => void { return async () => {}; }
export {};

//// [input.ts]
function f(): () => void { return async () => {}; }
export {};
