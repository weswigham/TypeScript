//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream765.ts] ////

//// [input.ts]
for (; b < foo; c++) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (; b < foo; c++) { if (foo) { bar(); } else { break; } }
