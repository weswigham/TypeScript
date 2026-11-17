//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1589.ts] ////

//// [input.ts]
for (; b < foo; c++) { for(;;) if (foo) break; break; }

//// [input.ts]
for (; b < foo; c++) { for(;;) if (foo) break; break; }
