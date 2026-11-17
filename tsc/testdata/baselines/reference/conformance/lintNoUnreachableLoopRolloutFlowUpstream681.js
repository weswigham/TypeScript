//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream681.ts] ////

//// [input.ts]
for (a; b; c) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a; b; c) { if (foo) { bar(); } else { break; } }
