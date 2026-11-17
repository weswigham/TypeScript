//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1377.ts] ////

//// [input.ts]
function someFunc() { while (a) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { while (a) { try { return bar(); } catch (e) { break; } } }
