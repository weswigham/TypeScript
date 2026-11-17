//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream486.ts] ////

//// [input.ts]
var foo = 0; while (foo ? 1 : 0) { } foo = 1;

//// [input.ts]
var foo = 0; while (foo ? 1 : 0) { } foo = 1;
