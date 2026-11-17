//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1961.ts] ////

//// [input.ts]
for (a in f(b)) { while (a); break; }

//// [input.ts]
for (a in f(b)) { while (a); break; }
