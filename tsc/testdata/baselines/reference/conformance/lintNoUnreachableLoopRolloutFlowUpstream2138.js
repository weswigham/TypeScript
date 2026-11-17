//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2138.ts] ////

//// [input.ts]
for (var a of f(b)) { for (; b;); break; }

//// [input.ts]
for (var a of f(b)) { for (; b;); break; }
