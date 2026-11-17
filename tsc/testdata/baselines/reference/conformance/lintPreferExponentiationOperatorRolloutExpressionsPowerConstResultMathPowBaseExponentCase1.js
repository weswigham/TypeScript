//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstResultMathPowBaseExponentCase1.ts] ////

//// [input.ts]
const result = Math.pow(-base, exponent);

//// [input.ts]
const result = (-base) ** exponent;
