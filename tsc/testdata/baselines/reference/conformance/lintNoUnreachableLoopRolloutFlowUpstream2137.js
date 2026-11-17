//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2137.ts] ////

//// [input.ts]
for (var a of f(b)) { for (a; b; c); break; }

//// [input.ts]
for (var a of f(b)) { for (a; b; c); break; }
