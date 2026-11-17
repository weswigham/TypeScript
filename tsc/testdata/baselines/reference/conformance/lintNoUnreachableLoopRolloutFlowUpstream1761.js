//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1761.ts] ////

//// [input.ts]
for (; ; c++) { for (; b;); break; }

//// [input.ts]
for (; ; c++) { for (; b;); break; }
