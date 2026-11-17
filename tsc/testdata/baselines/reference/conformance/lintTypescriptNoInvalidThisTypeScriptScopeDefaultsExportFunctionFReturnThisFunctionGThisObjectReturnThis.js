//// [tests/cases/conformance/lint/rules/no-invalid-this/lintTypescriptNoInvalidThisTypeScriptScopeDefaultsExportFunctionFReturnThisFunctionGThisObjectReturnThis.ts] ////

//// [input.ts]
export {}; function f() { return this; } function g(this: object) { return this; }

//// [input.ts]
export {}; function f() { return this; } function g(this: object) { return this; }
