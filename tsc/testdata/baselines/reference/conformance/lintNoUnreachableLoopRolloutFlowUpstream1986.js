//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1986.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (var a in b) { try { return bar(); } catch (e) { break; } } }
