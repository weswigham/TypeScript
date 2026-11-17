//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWorkMathPowBaseOtherExponent.ts] ////

//// [input.ts]
work()
Math.pow(base + other, exponent);

//// [input.ts]
work();
(base + other) ** exponent;
