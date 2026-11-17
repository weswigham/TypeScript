//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackBoundComments.ts] ////

//// [input.ts]
foo(function() { this; }.bind(/* keep */ this));

//// [input.ts]
foo(function() { this; }.bind(/* keep */ this));
