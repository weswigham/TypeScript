//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesOptionsAndRangesStrictClassProperty.ts] ////

//// [input.ts]
interface Base { fn(): void } class Derived implements Base { fn = () => 1; }

//// [input.ts]
interface Base { fn(): void } class Derived implements Base { fn = () => 1; }
