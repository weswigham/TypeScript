//// [tests/cases/conformance/lint/rules/no-bitwise/noBitwiseCoreB.ts] ////

//// [input.ts]
let value = 1;
value |= 2;
~value;
value << 1;
value >>>= 1;
value ||= 1;
value && 2;

//// [input.ts]
let value = 1;
value |= 2;
~value;
value << 1;
value >>>= 1;
value ||= 1;
value && 2;
