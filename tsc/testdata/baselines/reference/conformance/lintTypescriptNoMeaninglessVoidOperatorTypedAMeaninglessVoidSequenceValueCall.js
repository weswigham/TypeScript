//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidSequenceValueCall.ts] ////

//// [input.ts]
declare function f(): string; void (0, f());

//// [input.ts]
declare function f(): string; void (0, f());
