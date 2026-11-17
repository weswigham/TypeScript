//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1930.ts] ////

//// [input.ts]
for (a in b) { () => a; break; }

//// [input.ts]
for (a in b) { () => a; break; }
