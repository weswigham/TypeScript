//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackLogical.ts] ////

//// [input.ts]
foo(other || function() {});

//// [input.ts]
foo(other || (() => {}));
