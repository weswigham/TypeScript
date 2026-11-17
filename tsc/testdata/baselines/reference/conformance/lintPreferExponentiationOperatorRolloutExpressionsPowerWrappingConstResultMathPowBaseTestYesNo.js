//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingConstResultMathPowBaseTestYesNo.ts] ////

//// [input.ts]
const result = Math.pow(base, test ? yes : no);

//// [input.ts]
const result = base ** (test ? yes : no);
