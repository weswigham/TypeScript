//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseExponentCase4.ts] ////

//// [input.ts]
const result = Math.pow(!base, exponent);

//// [input.ts]
const result = (!base) ** exponent;
