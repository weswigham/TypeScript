//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesRolloutPromisesOptionsAndTypesClassChildTExtendsPromiseTDeclareConstValueChildN.ts] ////

//// [input.ts]
class Child<T> extends Promise<T> {} declare const value: Child<number>; value;
export {};

//// [input.ts]
class Child<T> extends Promise<T> {} declare const value: Child<number>; value;
export {};
