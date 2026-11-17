//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnDeclareFunctionSideVoidFunctionFFlagBooleanVoidIfFlagReturnSid.ts] ////

//// [input.ts]
declare function side(): void; function f(flag: boolean): void { if (flag) return side(); return; }

//// [input.ts]
declare function side(): void; function f(flag: boolean): void { if (flag) return side(); return; }
