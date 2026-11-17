//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1591.ts] ////

//// [input.ts]
for (; b < foo; c++) { for (a of b); break; }

//// [input.ts]
for (; b < foo; c++) { for (a of b); break; }
