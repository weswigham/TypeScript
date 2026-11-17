//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1959.ts] ////

//// [input.ts]
for (a in f(b)) { () => a; break; }

//// [input.ts]
for (a in f(b)) { () => a; break; }
