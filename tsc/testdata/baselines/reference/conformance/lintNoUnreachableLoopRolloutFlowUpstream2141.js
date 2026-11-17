//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2141.ts] ////

//// [input.ts]
for (var a of f(b)) { for (a in b); break; }

//// [input.ts]
for (var a of f(b)) { for (a in b); break; }
