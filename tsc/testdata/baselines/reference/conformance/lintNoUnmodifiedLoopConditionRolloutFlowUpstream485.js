//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream485.ts] ////

//// [input.ts]
var a, b, c; while (a < c && b < c) { ++a; } foo = 1;

//// [input.ts]
var a, b, c; while (a < c && b < c) { ++a; } foo = 1;
