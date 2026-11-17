//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream484.ts] ////

//// [input.ts]
var foo = 0, bar = 0; while (foo && bar) { ++foo; } foo = 1;

//// [input.ts]
var foo = 0, bar = 0; while (foo && bar) { ++foo; } foo = 1;
