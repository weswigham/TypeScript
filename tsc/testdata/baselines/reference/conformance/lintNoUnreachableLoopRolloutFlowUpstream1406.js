//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1406.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { while (a && b) { try { return bar(); } catch (e) { break; } } }
