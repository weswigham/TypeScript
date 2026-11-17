//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1697.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { break; continue; }

//// [input.ts]
for (a = 0; b < foo; ) { break; continue; }
