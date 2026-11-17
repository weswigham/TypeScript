//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackBound.ts] ////

//// [input.ts]
foo(function() { this; }.bind(this));

//// [input.ts]
foo(() => { this; });
