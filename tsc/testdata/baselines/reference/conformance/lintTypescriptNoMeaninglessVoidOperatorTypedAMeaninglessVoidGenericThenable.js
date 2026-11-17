//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidGenericThenable.ts] ////

//// [input.ts]
function f<T extends Promise<unknown>>(value: T) { void value; }

//// [input.ts]
function f<T extends Promise<unknown>>(value: T) { void value; }
