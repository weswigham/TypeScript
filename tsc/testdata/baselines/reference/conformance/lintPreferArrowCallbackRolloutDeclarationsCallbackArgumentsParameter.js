//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackArgumentsParameter.ts] ////

//// [input.ts]
foo(function(arguments) { arguments; });

//// [input.ts]
foo((arguments) => { arguments; });
