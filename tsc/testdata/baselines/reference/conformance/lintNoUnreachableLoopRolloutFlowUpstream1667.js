//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1667.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a; b;) { try { return bar(); } catch (e) { break; } } }
