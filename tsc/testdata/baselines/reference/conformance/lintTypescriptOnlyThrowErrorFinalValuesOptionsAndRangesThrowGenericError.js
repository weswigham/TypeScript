//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowGenericError.ts] ////

//// [input.ts]
function fn<T extends Error>(value: T) { throw value; }

//// [input.ts]
function fn<T extends Error>(value: T) { throw value; }
