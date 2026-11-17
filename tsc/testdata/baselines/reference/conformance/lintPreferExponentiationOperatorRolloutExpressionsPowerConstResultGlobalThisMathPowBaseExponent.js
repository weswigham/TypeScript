//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerConstResultGlobalThisMathPowBaseExponent.ts] ////

//// [input.ts]
const result = globalThis.Math.pow(base, exponent);

//// [input.ts]
const result = base ** exponent;
