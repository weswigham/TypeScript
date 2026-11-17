//// [tests/cases/conformance/lint/rules/no-unsafe-call/lintTypescriptNoUnsafeCallRolloutUnsafeFlowFunctionShadow.ts] ////

//// [input.ts]
{ type Function = () => void; declare const value: Function; value(); }

//// [input.ts]
{ type Function = () => void; declare const value: Function; value(); }
