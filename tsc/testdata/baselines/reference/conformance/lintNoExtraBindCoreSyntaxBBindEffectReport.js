//// [tests/cases/conformance/lint/rules/no-extra-bind/lintNoExtraBindCoreSyntaxBBindEffectReport.ts] ////

//// [input.ts]
const first = function() {}.bind(work()); const second = function() {}.bind(value, other);

//// [input.ts]
const first = function() {}.bind(work()); const second = function() {}.bind(value, other);
