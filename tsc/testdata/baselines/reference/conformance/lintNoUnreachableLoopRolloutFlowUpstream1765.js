//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1765.ts] ////

//// [input.ts]
for (; ; c++) { for (a of b); break; }

//// [input.ts]
for (; ; c++) { for (a of b); break; }
