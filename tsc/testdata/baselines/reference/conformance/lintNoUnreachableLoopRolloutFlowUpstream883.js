//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream883.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { continue; break; }

//// [input.ts]
for (a = 0; b < foo; ) { continue; break; }
