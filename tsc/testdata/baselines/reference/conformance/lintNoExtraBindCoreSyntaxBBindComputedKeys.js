//// [tests/cases/conformance/lint/rules/no-extra-bind/lintNoExtraBindCoreSyntaxBBindComputedKeys.ts] ////

//// [input.ts]
const first = function() { class Item { [this.key] = 1; } }.bind(value);

//// [input.ts]
const first = function() { class Item { [this.key] = 1; } }.bind(value);
