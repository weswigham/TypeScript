//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1921.ts] ////

//// [input.ts]
for (a in b) { break; foo(); }

//// [input.ts]
for (a in b) { break; foo(); }
