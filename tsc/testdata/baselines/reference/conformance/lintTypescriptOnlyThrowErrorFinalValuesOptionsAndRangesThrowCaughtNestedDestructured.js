//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowCaughtNestedDestructured.ts] ////

//// [input.ts]
try {} catch ({ nested: { message: value } }) { throw value; }

//// [input.ts]
try {} catch ({ nested: { message: value } }) { throw value; }
