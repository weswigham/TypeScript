//// [tests/cases/conformance/lint/rules/no-unmodified-loop-condition/lintNoUnmodifiedLoopConditionRolloutFlowUpstream477.ts] ////

//// [input.ts]
var a = [1, 2, 3]; var len = a.length; for (var i = 0; i < len - 1; i++) {}

//// [input.ts]
var a = [1, 2, 3]; var len = a.length; for (var i = 0; i < len - 1; i++) {}
