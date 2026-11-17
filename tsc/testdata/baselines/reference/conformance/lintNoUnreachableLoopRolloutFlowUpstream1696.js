//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1696.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { try { return bar(); } catch (e) { break; } } }
