//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1870.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { try { return bar(); } catch (e) { break; } } }
