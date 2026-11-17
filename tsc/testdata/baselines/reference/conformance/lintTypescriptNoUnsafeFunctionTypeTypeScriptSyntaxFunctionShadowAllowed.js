//// [tests/cases/conformance/lint/rules/no-unsafe-function-type/lintTypescriptNoUnsafeFunctionTypeTypeScriptSyntaxFunctionShadowAllowed.ts] ////

//// [input.ts]
{ type Function = () => void; let fn: Function; }

//// [input.ts]
{ type Function = () => void; let fn: Function; }
