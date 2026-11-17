//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream597.ts] ////

//// [input.ts]
while (a && b) { if (foo) { bar(); } else { break; } }

//// [input.ts]
while (a && b) { if (foo) { bar(); } else { break; } }
