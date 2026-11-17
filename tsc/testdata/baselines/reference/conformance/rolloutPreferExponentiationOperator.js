//// [tests/cases/conformance/lint/rules/prefer-exponentiation-operator/rolloutPreferExponentiationOperator.ts] ////

//// [input.ts]
declare const value: number, exponent: number;
Math.pow(value, exponent);
Math.pow(-value, exponent + 1);
Math.pow(value, exponent).toString();
const { pow } = Math;
pow(value, exponent);
Math.pow(/* keep */ value, exponent);
function shadowed(Math: any) { return Math.pow(value, exponent); }

//// [input.ts]
declare const value: number, exponent: number;
value ** exponent;
(-value) ** (exponent + 1);
(value ** exponent).toString();
const { pow } = Math;
value ** exponent;
Math.pow(/* keep */ value, exponent);
function shadowed(Math: any) { return Math.pow(value, exponent); }
