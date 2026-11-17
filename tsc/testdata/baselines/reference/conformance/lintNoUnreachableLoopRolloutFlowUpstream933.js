//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream933.ts] ////

//// [input.ts]
for (; ; c++) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (; ; c++) { if (foo) { bar(); } else { break; } }
