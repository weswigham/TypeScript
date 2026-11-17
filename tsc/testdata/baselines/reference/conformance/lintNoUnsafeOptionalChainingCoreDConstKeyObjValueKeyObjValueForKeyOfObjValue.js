//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/lintNoUnsafeOptionalChainingCoreDConstKeyObjValueKeyObjValueForKeyOfObjValue.ts] ////

//// [input.ts]
const { key } = obj?.value; ([key] = obj?.value); for (key of obj?.value) {}

//// [input.ts]
const { key } = obj?.value; ([key] = obj?.value); for (key of obj?.value) {}
