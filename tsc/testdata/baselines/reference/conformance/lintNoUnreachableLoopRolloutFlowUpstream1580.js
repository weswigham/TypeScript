//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1580.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { try { return bar(); } catch (e) { break; } } }
