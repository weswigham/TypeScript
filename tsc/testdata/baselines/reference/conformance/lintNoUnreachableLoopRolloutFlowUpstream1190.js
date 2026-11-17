//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1190.ts] ////

//// [input.ts]
function someFunc() { for (let a in f(b)) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (let a in f(b)) { try { return bar(); } catch (e) {} } }
