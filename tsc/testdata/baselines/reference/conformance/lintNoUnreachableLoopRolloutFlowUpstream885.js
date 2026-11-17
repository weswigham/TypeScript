//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream885.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { () => a }

//// [input.ts]
for (a = 0; b < foo; ) { () => a }
