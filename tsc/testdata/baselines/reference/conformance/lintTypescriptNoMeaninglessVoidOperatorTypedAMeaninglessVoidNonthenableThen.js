//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidNonthenableThen.ts] ////

//// [input.ts]
declare const value: { then(cb: number): void }; void value;

//// [input.ts]
declare const value: { then(cb: number): void }; value;
