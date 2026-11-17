//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream686.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a; b; c) { try { return bar(); } catch (e) {} } }
