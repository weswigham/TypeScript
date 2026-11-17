//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseFirstSecond.ts] ////

//// [input.ts]
const result = Math.pow(base, (first, second));

//// [input.ts]
const result = base ** (first, second);
