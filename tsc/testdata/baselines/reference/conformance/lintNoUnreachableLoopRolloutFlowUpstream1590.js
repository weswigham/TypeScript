//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1590.ts] ////

//// [input.ts]
for (; b < foo; c++) { for (a in b); break; }

//// [input.ts]
for (; b < foo; c++) { for (a in b); break; }
