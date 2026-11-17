//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1413.ts] ////

//// [input.ts]
while (a && b) { for (; b;); break; }

//// [input.ts]
while (a && b) { for (; b;); break; }
