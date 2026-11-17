//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingWorkMathPowBaseExponentCase2.ts] ////

//// [input.ts]
work()
Math.pow(++base, exponent);

//// [input.ts]
work()
++base ** exponent;
