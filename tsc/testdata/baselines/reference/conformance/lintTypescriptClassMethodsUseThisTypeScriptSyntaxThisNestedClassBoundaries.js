//// [tests/cases/conformance/lint/rules/class-methods-use-this/lintTypescriptClassMethodsUseThisTypeScriptSyntaxThisNestedClassBoundaries.ts] ////

//// [input.ts]
class Item { run() { class Nested { field = this; } } }

//// [input.ts]
class Item { run() { class Nested { field = this; } } }
