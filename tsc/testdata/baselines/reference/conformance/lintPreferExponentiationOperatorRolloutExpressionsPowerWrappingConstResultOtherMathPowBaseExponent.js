//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultOtherMathPowBaseExponent.ts] ////

//// [input.ts]
const result = other ** Math.pow(base, exponent);

//// [input.ts]
const result = other ** base ** exponent;
