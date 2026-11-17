//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1669.ts] ////

//// [input.ts]
for (a; b;) { () => a; break; }

//// [input.ts]
for (a; b;) { () => a; break; }
