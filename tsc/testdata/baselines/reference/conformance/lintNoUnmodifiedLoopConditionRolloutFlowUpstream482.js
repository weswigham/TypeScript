//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream482.ts] ////

//// [input.ts]
var foo = 0, bar = 9; while (foo < bar) { } foo = 1;

//// [input.ts]
var foo = 0, bar = 9; while (foo < bar) { } foo = 1;
