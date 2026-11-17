//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1017.ts] ////

//// [input.ts]
for (a; ;) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a; ;) { if (foo) { bar(); } else { break; } }
