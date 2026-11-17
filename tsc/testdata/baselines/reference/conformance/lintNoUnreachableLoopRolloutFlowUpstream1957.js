//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1957.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a in f(b)) { try { return bar(); } catch (e) { break; } } }
