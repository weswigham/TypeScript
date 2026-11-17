//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackLocalArguments.ts] ////

//// [input.ts]
foo(function() { var arguments; consume(arguments); });

//// [input.ts]
foo(() => { var arguments; consume(arguments); });
