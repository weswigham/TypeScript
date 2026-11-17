//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1732.ts] ////

//// [input.ts]
for (; ; c) { for (; b;); break; }

//// [input.ts]
for (; ; c) { for (; b;); break; }
