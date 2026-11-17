//// [tests/cases/conformance/lint/rules/no-unsafe-unary-minus/lintTypescriptNoUnsafeUnaryMinusTypedBUnaryMinusFunctionFTExtendsNumberBigintValueTReturnValue.ts] ////

//// [input.ts]
function f<T extends number | bigint>(value: T) { return -value; }

//// [input.ts]
function f<T extends number | bigint>(value: T) { return -value; }
