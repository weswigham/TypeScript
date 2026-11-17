//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream775.ts] ////

//// [input.ts]
for (; b < foo; c++) { (() => a)() }

//// [input.ts]
for (; b < foo; c++) { (() => a)() }
