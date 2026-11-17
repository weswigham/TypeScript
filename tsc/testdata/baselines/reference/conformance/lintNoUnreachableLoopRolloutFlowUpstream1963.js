//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1963.ts] ////

//// [input.ts]
for (a in f(b)) { for (a; b; c); break; }

//// [input.ts]
for (a in f(b)) { for (a; b; c); break; }
