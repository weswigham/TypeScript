//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingWorkMathPowBaseExponentCase1.ts] ////

//// [input.ts]
work()
Math.pow([base], exponent);

//// [input.ts]
work();
[base] ** exponent;
