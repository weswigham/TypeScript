//// [tests/cases/conformance/lint/rules/no-implied-eval/lintTypescriptNoImpliedEvalRolloutPromisesOptionsAndTypesFunctionFSetTimeoutValueStringVoidSetTimeoutText.ts] ////

//// [input.ts]
function f(setTimeout: (value: string) => void) { setTimeout('text'); }
export {};

//// [input.ts]
function f(setTimeout: (value: string) => void) { setTimeout('text'); }
export {};
