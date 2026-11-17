//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstResultMathPowBaseExponentToString.ts] ////

//// [input.ts]
const result = Math.pow(base, exponent).toString();

//// [input.ts]
const result = (base ** exponent).toString();
