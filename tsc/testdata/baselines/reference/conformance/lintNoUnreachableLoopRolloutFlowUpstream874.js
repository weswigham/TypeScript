//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream874.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { continue; }

//// [input.ts]
for (a = 0; b < foo; ) { continue; }
