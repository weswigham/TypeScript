//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream460.ts] ////

//// [input.ts]
var foo = 0, f = {}, bar = {}; while (foo === f(bar)) { }

//// [input.ts]
var foo = 0, f = {}, bar = {}; while (foo === f(bar)) { }
