//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream489.ts] ////

//// [input.ts]
for (var foo = 0; foo < 10; ) { } foo = 1;

//// [input.ts]
for (var foo = 0; foo < 10; ) { } foo = 1;
