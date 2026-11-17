//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1841.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a; ;) { try { return bar(); } catch (e) { break; } } }
