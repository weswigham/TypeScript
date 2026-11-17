//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableESLintFlowBoundariesFunctionFThrowErrorWork.ts] ////

//// [input.ts]
function f() { (() => { throw error; })(); work(); }

//// [input.ts]
function f() { (() => { throw error; })(); work(); }
