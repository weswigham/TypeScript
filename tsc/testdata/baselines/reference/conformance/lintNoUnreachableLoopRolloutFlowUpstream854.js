//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream854.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a; b;) { try { return bar(); } catch (e) {} } }
