//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnFunctionFFlagBooleanSwitchFlagCaseTrueReturn1DefaultThrow2.ts] ////

//// [input.ts]
function f(flag: boolean) { switch (flag) { case true: return 1; default: throw 2; } }

//// [input.ts]
function f(flag: boolean) { switch (flag) { case true: return 1; default: throw 2; } }
