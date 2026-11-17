//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1698.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { () => a; break; }

//// [input.ts]
for (a = 0; b < foo; ) { () => a; break; }
