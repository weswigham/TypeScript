//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesOptionsAndRangesBaseIgnoredAncestor.ts] ////

//// [input.ts]
class Base {} class Derived extends Base {} String(new Derived());

//// [input.ts]
class Base {} class Derived extends Base {} String(new Derived());
