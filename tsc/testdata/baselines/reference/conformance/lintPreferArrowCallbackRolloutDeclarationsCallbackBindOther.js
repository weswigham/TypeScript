//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackBindOther.ts] ////

//// [input.ts]
foo(function() {}.bind(other));

//// [input.ts]
foo((() => {}).bind(other));
