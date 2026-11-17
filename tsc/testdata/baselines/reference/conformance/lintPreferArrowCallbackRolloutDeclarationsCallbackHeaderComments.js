//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackHeaderComments.ts] ////

//// [input.ts]
foo(function /* keep */ named() {});

//// [input.ts]
foo( /* keep */ () => {});
