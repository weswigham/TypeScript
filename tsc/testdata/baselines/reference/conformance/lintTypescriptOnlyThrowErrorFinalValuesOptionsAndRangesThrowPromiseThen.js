//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowPromiseThen.ts] ////

//// [input.ts]
Promise.reject().then(undefined, value => { throw value; });

//// [input.ts]
Promise.reject().then(undefined, value => { throw value; });
