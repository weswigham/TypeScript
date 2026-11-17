//// [tests/cases/conformance/lint/rules/no-extra-bind/lintNoExtraBindCoreSyntaxBBindLexicalThis.ts] ////

//// [input.ts]
const first = function() { return () => this; }.bind(value); const second = (() => this).bind(value);

//// [input.ts]
const first = function() { return () => this; }.bind(value); const second = ((() => this));
