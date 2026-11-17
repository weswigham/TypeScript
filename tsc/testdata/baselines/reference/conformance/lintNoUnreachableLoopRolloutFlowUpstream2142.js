//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2142.ts] ////

//// [input.ts]
for (var a of f(b)) { for (a of b); break; }

//// [input.ts]
for (var a of f(b)) { for (a of b); break; }
