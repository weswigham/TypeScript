//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1101.ts] ////

//// [input.ts]
for (a in b) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a in b) { if (foo) { bar(); } else { break; } }
