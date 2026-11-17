//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1899.ts] ////

//// [input.ts]
function someFunc() { for (;;) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (;;) { try { return bar(); } catch (e) { break; } } }
