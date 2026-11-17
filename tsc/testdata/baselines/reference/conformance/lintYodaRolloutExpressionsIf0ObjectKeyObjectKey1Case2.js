//// [tests/cases/conformance/lint/rules/yoda/lintYodaRolloutExpressionsIf0ObjectKeyObjectKey1Case2.ts] ////

//// [input.ts]
if (0 <= object[key] && object['key'] <= 1) {}

//// [input.ts]
if (object[key] >= 0 && object['key'] <= 1) {}
