//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1683.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { break; }

//// [input.ts]
for (a = 0; b < foo; ) { break; }
