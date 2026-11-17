//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1045.ts] ////

//// [input.ts]
for (a = 0; ;) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a = 0; ;) { if (foo) { bar(); } else { break; } }
