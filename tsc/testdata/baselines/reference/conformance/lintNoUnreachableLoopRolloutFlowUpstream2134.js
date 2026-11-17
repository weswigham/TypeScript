//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2134.ts] ////

//// [input.ts]
for (var a of f(b)) { (() => a)(); break; }

//// [input.ts]
for (var a of f(b)) { (() => a)(); break; }
