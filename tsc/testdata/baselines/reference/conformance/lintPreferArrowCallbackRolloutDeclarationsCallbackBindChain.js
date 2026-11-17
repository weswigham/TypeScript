//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackBindChain.ts] ////

//// [input.ts]
foo(function() {}.bind(this).bind(other));

//// [input.ts]
foo((() => {}).bind(other));
