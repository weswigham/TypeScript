//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1950.ts] ////

//// [input.ts]
for (a in f(b)) { break; foo(); }

//// [input.ts]
for (a in f(b)) { break; foo(); }
