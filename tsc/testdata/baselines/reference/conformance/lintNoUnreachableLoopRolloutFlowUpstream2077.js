//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2077.ts] ////

//// [input.ts]
for (a of f(b)) { while (a); break; }

//// [input.ts]
for (a of f(b)) { while (a); break; }
