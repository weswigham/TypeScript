//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnFunctionFFlagBooleanUndefinedIfFlagReturnUndefinedReturn.ts] ////

//// [input.ts]
function f(flag: boolean): undefined { if (flag) return undefined; return; }

//// [input.ts]
function f(flag: boolean): undefined { if (flag) return undefined; return; }
