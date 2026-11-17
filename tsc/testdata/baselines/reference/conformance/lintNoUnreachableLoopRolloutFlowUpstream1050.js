//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1050.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { try { return bar(); } catch (e) {} } }
