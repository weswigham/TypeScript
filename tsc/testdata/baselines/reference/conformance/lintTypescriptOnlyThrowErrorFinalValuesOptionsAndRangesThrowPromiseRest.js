//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowPromiseRest.ts] ////

//// [input.ts]
Promise.reject().catch((...value) => { throw value; });

//// [input.ts]
Promise.reject().catch((...value) => { throw value; });
