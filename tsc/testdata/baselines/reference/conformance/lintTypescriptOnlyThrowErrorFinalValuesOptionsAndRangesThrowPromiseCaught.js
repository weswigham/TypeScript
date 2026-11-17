//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowPromiseCaught.ts] ////

//// [input.ts]
Promise.reject().catch(value => { throw value; });

//// [input.ts]
Promise.reject().catch(value => { throw value; });
