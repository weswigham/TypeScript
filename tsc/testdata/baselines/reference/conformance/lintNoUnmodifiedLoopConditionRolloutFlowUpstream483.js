//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream483.ts] ////

//// [input.ts]
var foo = 0, bar = 0; while (foo && bar) { ++bar; } foo = 1;

//// [input.ts]
var foo = 0, bar = 0; while (foo && bar) { ++bar; } foo = 1;
