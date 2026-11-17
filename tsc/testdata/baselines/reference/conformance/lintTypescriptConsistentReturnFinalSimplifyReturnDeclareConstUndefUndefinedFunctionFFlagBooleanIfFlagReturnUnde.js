//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnDeclareConstUndefUndefinedFunctionFFlagBooleanIfFlagReturnUnde.ts] ////

//// [input.ts]
declare const undef: undefined; function f(flag: boolean) { if (flag) return undef; return; }

//// [input.ts]
declare const undef: undefined; function f(flag: boolean) { if (flag) return undef; return; }
