//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidRestCallbackThenable.ts] ////

//// [input.ts]
declare const promise: { then(...cb: (() => void)[]): void }; void promise;

//// [input.ts]
declare const promise: { then(...cb: (() => void)[]): void }; void promise;
