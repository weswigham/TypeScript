//// [tests/cases/conformance/lint/rules/class-methods-use-this/lintClassMethodsUseThisCoreSyntaxAThisUsage.ts] ////

//// [input.ts]
class C { method() {} used() { return () => this; } field = () => 1; static staticMethod() {} }

//// [input.ts]
class C { method() {} used() { return () => this; } field = () => 1; static staticMethod() {} }
