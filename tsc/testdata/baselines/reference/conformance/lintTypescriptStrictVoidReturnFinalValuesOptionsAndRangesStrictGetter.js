//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesOptionsAndRangesStrictGetter.ts] ////

//// [input.ts]
class Base { fn() {} } class Derived extends Base { get fn() { return () => 1; } }

//// [input.ts]
class Base { fn() {} } class Derived extends Base { get fn() { return () => 1; } }
