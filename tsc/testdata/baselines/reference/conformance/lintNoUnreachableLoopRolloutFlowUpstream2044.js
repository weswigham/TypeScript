//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2044.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a of b) { try { return bar(); } catch (e) { break; } } }
