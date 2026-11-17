//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2131.ts] ////

//// [input.ts]
function someFunc() { for (var a of f(b)) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (var a of f(b)) { try { return bar(); } catch (e) { break; } } }
