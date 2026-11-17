//// [tests/cases/conformance/lint/rules/class-methods-use-this/lintTypescriptClassMethodsUseThisTypeScriptSyntaxThisLexicalArrows.ts] ////

//// [input.ts]
class Item { first() { return () => this; } second() { return function() { return this; }; } field = () => 1; static staticMethod() {} }

//// [input.ts]
class Item { first() { return () => this; } second() { return function() { return this; }; } field = () => 1; static staticMethod() {} }
