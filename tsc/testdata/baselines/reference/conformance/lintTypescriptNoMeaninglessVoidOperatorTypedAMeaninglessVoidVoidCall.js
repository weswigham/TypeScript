//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidVoidCall.ts] ////

//// [input.ts]
declare function f(): void; void f();

//// [input.ts]
declare function f(): void; f();
