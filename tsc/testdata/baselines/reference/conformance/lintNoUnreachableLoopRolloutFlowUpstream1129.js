//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1129.ts] ////

//// [input.ts]
for (a in f(b)) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a in f(b)) { if (foo) { bar(); } else { break; } }
