//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1763.ts] ////

//// [input.ts]
for (; ; c++) { for(;;) if (foo) break; break; }

//// [input.ts]
for (; ; c++) { for(;;) if (foo) break; break; }
