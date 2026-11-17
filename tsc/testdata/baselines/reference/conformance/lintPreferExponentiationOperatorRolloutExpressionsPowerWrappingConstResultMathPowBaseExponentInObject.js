//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseExponentInObject.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent)in object;

//// [input.ts]
const result = base ** exponent in object;
