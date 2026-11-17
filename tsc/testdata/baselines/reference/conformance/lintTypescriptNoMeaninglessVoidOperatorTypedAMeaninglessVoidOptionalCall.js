//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidOptionalCall.ts] ////

//// [input.ts]
declare const obj: { f(): void } | undefined; void obj?.f();

//// [input.ts]
declare const obj: { f(): void } | undefined; obj?.f();
