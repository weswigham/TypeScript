//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2135.ts] ////

//// [input.ts]
for (var a of f(b)) { while (a); break; }

//// [input.ts]
for (var a of f(b)) { while (a); break; }
