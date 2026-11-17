//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1134.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (a in f(b)) { try { return bar(); } catch (e) {} } }
