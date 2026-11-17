//// [tests/cases/conformance/lint/rules/no-implied-eval/lintTypescriptNoImpliedEvalRolloutPromisesDefaults.ts] ////

//// [input.ts]
setTimeout('alert(1)', 0); setTimeout(() => {}, 0);
export {};

//// [input.ts]
setTimeout('alert(1)', 0); setTimeout(() => {}, 0);
export {};
