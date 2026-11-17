//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream821.ts] ////

//// [input.ts]
for (a = 0; ; c++) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a = 0; ; c++) { if (foo) { bar(); } else { break; } }
