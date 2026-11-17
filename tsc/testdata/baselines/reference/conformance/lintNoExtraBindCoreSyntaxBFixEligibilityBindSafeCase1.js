//// [tests/cases/conformance/lint/rules/no-extra-bind/lintNoExtraBindCoreSyntaxBFixEligibilityBindSafeCase1.ts] ////

//// [input.ts]
const run = function() { return 1; }.bind(value);

//// [input.ts]
const run = (function() { return 1; });
