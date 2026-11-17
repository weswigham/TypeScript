//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1989.ts] ////

//// [input.ts]
for (var a in b) { (() => a)(); break; }

//// [input.ts]
for (var a in b) { (() => a)(); break; }
