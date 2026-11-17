//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream976.ts] ////

//// [input.ts]
for (; b;) for (; ; c) if (foo) break;

//// [input.ts]
for (; b;) for (; ; c) if (foo) break;
