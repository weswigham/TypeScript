//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1586.ts] ////

//// [input.ts]
for (; b < foo; c++) { for (a; b; c); break; }

//// [input.ts]
for (; b < foo; c++) { for (a; b; c); break; }
