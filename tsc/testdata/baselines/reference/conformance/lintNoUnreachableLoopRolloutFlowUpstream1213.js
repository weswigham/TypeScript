//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1213.ts] ////

//// [input.ts]
for (a of b) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a of b) { if (foo) { bar(); } else { break; } }
