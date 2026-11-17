//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesOptionsAndRangesBaseGenericAncestor.ts] ////

//// [input.ts]
class Base {} class Derived<T> extends Base { value!: T } declare const value: Derived<number>; String(value);

//// [input.ts]
class Base {} class Derived<T> extends Base { value!: T } declare const value: Derived<number>; String(value);
