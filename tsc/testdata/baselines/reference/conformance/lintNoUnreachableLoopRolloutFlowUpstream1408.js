//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1408.ts] ////

//// [input.ts]
while (a && b) { () => a; break; }

//// [input.ts]
while (a && b) { () => a; break; }
