//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1812.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { try { return bar(); } catch (e) { break; } } }
