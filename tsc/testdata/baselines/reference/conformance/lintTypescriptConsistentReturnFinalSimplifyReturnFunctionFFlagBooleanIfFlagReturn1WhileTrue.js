//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnFunctionFFlagBooleanIfFlagReturn1WhileTrue.ts] ////

//// [input.ts]
function f(flag: boolean) { if (flag) return 1; while (true) {} }

//// [input.ts]
function f(flag: boolean) { if (flag) return 1; while (true) {} }
