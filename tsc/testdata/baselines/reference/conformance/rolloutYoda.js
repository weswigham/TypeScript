//// [tests/cases/conformance/lint/rules/yoda/rolloutYoda.ts] ////

//// [input.ts]
declare const value: number, object: any;
if (1 < value) {}
if (-1n <= value) {}
if (0 <= value && value < 1) {}
if (1 <= value && value < 0) {}
if (0 <= object.value && object["value"] <= 1) {}

//// [input.ts]
declare const value: number, object: any;
if (value > 1) {}
if (value >= -1n) {}
if (0 <= value && value < 1) {}
if (value >= 1 && value < 0) {}
if (0 <= object.value && object["value"] <= 1) {}
