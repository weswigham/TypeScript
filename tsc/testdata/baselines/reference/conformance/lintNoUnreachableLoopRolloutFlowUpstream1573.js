//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1573.ts] ////

//// [input.ts]
for (; b < foo; c++) { break; foo(); }

//// [input.ts]
for (; b < foo; c++) { break; foo(); }
