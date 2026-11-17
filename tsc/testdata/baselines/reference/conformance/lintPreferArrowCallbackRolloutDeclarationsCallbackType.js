//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackType.ts] ////

//// [input.ts]
foo(function(x: string): string { return x; });

//// [input.ts]
foo((x: string): string => { return x; });
