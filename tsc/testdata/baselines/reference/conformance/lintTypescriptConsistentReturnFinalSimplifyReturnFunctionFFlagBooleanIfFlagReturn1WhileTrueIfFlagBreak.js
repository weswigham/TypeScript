//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnFunctionFFlagBooleanIfFlagReturn1WhileTrueIfFlagBreak.ts] ////

//// [input.ts]
function f(flag: boolean) { if (flag) return 1; while (true) { if (flag) break; } }

//// [input.ts]
function f(flag: boolean) { if (flag) return 1; while (true) { if (flag) break; } }
