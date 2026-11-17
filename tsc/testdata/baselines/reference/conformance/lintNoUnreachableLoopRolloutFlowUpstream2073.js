//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2073.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (a of f(b)) { try { return bar(); } catch (e) { break; } } }
