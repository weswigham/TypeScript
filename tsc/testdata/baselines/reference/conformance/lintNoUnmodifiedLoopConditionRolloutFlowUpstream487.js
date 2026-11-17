//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream487.ts] ////

//// [input.ts]
var foo = 0; while (foo) { update(); } function update(foo) { ++foo; }

//// [input.ts]
var foo = 0; while (foo) { update(); } function update(foo) { ++foo; }
