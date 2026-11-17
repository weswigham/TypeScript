//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstPowPowerMathConstResultPowerBaseExponent.ts] ////

//// [input.ts]
const {pow: power} = Math; const result = power(base, exponent);

//// [input.ts]
const {pow: power} = Math; const result = base ** exponent;
