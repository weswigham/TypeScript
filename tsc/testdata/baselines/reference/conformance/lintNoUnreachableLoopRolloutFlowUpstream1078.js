//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1078.ts] ////

//// [input.ts]
function someFunc() { for (;;) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (;;) { try { return bar(); } catch (e) {} } }
