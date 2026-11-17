//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2079.ts] ////

//// [input.ts]
for (a of f(b)) { for (a; b; c); break; }

//// [input.ts]
for (a of f(b)) { for (a; b; c); break; }
