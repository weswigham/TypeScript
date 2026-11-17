//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/lintPreferArrowCallbackRolloutDeclarationsCallbackConditional.ts] ////

//// [input.ts]
foo(ok ? function() {} : other);

//// [input.ts]
foo(ok ? () => {} : other);
