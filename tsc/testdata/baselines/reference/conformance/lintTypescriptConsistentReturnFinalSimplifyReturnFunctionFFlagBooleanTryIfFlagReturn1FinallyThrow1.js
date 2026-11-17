//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnFunctionFFlagBooleanTryIfFlagReturn1FinallyThrow1.ts] ////

//// [input.ts]
function f(flag: boolean) { try { if (flag) return 1; } finally { throw 1; } }

//// [input.ts]
function f(flag: boolean) { try { if (flag) return 1; } finally { throw 1; } }
