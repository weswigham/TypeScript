//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2123.ts] ////

//// [input.ts]
for (var a of f(b)) { foo(); break; }

//// [input.ts]
for (var a of f(b)) { foo(); break; }
