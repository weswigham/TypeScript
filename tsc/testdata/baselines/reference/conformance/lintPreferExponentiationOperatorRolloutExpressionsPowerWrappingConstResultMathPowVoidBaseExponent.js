//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowVoidBaseExponent.ts] ////

//// [input.ts]
const result = Math.pow(void base, exponent);

//// [input.ts]
const result = (void base) ** exponent;
