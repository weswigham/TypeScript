//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1638.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { try { return bar(); } catch (e) { break; } } }
