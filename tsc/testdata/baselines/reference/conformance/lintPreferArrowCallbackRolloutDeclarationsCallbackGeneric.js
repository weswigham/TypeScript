//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackGeneric.ts] ////

//// [input.ts]
foo(function<T>(x: T): T { return x; });

//// [input.ts]
foo(<T>(x: T): T => { return x; });
