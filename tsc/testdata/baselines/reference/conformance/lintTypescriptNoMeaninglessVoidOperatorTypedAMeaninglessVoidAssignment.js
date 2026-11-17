//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidAssignment.ts] ////

//// [input.ts]
let value: number; () => void (value = 1); void (value += 2);

//// [input.ts]
let value: number; () => void (value = 1); void (value += 2);
