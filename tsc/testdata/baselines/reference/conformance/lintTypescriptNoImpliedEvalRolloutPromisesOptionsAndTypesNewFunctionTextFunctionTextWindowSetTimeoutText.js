//// [tests/cases/conformance/lint/rules/no-implied-eval/lintTypescriptNoImpliedEvalRolloutPromisesOptionsAndTypesNewFunctionTextFunctionTextWindowSetTimeoutText.ts] ////

//// [input.ts]
new Function('text'); Function('text'); window['setTimeout']('text');
export {};

//// [input.ts]
new Function('text'); Function('text'); window['setTimeout']('text');
export {};
