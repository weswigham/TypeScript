//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackName.ts] ////

//// [input.ts]
foo(function named(x) { return x; });

//// [input.ts]
foo((x) => { return x; });
