//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstResultMathPowBaseExponentOther.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent + other);

//// [input.ts]
const result = base ** (exponent + other);
