//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1246.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a of f(b)) { try { return bar(); } catch (e) {} } }
