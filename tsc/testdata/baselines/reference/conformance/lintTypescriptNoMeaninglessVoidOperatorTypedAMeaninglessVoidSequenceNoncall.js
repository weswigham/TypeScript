//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidSequenceNoncall.ts] ////

//// [input.ts]
declare function f(): void; declare const value: string; void (f(), value);

//// [input.ts]
declare function f(): void; declare const value: string; (f(), value);
