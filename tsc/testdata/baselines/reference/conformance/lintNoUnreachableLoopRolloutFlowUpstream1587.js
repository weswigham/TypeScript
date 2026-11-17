//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1587.ts] ////

//// [input.ts]
for (; b < foo; c++) { for (; b;); break; }

//// [input.ts]
for (; b < foo; c++) { for (; b;); break; }
