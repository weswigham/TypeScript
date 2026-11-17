//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/lintPreferExponentiationOperatorRolloutExpressionsPowerWrappingAsyncFunctionRunReturnMathPowBaseAwaitExponent.ts] ////

//// [input.ts]
async function run() { return Math.pow(base, await exponent); }

//// [input.ts]
async function run() { return base ** await exponent; }
